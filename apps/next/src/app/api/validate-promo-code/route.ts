import { type NextRequest, NextResponse } from "next/server";
import { stripe } from "../stripe";

// Helper function to check if promotion code is expired
const isPromotionCodeExpired = (
  active: boolean | null,
  expiresAt: number | null
): boolean => {
  if (active === false) {
    return true;
  }
  if (expiresAt && expiresAt * 1000 < Date.now()) {
    return true;
  }
  return false;
};

// Helper function to check if promotion code has reached max redemptions
const hasReachedMaxRedemptions = (
  maxRedemptions: number | null,
  timesRedeemed: number | null
): boolean => {
  if (!(maxRedemptions && timesRedeemed)) {
    return false;
  }
  return timesRedeemed >= maxRedemptions;
};

// Helper function to calculate discount value
const calculateDiscountValue = (
  percentOff: number | null,
  amountOff: number | null
): number => {
  if (percentOff) {
    return percentOff;
  }
  if (amountOff) {
    return amountOff / 100;
  }
  return 0;
};

// Helper function to handle temporary test coupon code
const handleTemporaryCouponCode = async (
  code: string
): Promise<{ valid: true; discountInfo: Record<string, unknown> } | null> => {
  if (code !== "20PROMO2025") {
    return null;
  }

  try {
    const coupon = await stripe.coupons.retrieve("20PROMO2025");
    if (coupon?.valid) {
      return {
        valid: true,
        discountInfo: {
          id: "promo_20promo2025",
          code: "20PROMO2025",
          couponId: coupon.id,
          discountType: coupon.percent_off ? "percentage" : "fixed",
          discountValue: calculateDiscountValue(
            coupon.percent_off,
            coupon.amount_off
          ),
          name: coupon.name || coupon.id,
        },
      };
    }
  } catch {
    // If coupon doesn't exist, fall through to normal validation
    console.log("Test coupon not found, trying normal validation");
  }

  return null;
};

// Helper function to get coupon from promotion code
const getCouponFromPromotionCode = async (promotionCode: {
  coupon?: unknown;
  [key: string]: unknown;
}) => {
  let couponId: string | null = null;
  let coupon: Awaited<ReturnType<typeof stripe.coupons.retrieve>> | undefined;

  if (
    "coupon" in promotionCode &&
    promotionCode.coupon &&
    typeof promotionCode.coupon === "object" &&
    "id" in promotionCode.coupon &&
    typeof promotionCode.coupon.id === "string"
  ) {
    coupon = promotionCode.coupon as Awaited<
      ReturnType<typeof stripe.coupons.retrieve>
    >;
    couponId = promotionCode.coupon.id;
  } else if (
    "coupon" in promotionCode &&
    typeof promotionCode.coupon === "string"
  ) {
    couponId = promotionCode.coupon;
  }

  if (!couponId) {
    return null;
  }

  if (!coupon) {
    coupon = await stripe.coupons.retrieve(couponId);
  }

  return coupon;
};

// Helper function to validate promotion code
const validatePromotionCode = async (code: string) => {
  const normalizedCode = code.toUpperCase().trim();

  // Temporary: Handle specific test coupon code
  const tempResult = await handleTemporaryCouponCode(normalizedCode);
  if (tempResult) {
    return tempResult;
  }

  const promotionCodes = await stripe.promotionCodes.list({
    code: normalizedCode,
    limit: 1,
    active: true,
    expand: ["data.coupon"],
  });

  if (promotionCodes.data.length === 0 || !promotionCodes.data[0]) {
    return {
      valid: false,
      error: "Invalid promotion code",
    };
  }

  const promotionCode = promotionCodes.data[0];

  if (!promotionCode) {
    return {
      valid: false,
      error: "Invalid promotion code",
    };
  }

  // Get coupon from promotion code
  const coupon = await getCouponFromPromotionCode(
    promotionCode as unknown as { coupon?: unknown; [key: string]: unknown }
  );

  if (!coupon) {
    return {
      valid: false,
      error: "Invalid promotion code - missing coupon",
    };
  }

  if (!coupon?.valid) {
    return {
      valid: false,
      error: "This promotion code is no longer valid",
    };
  }

  if (isPromotionCodeExpired(promotionCode.active, promotionCode.expires_at)) {
    return {
      valid: false,
      error: "This promotion code has expired",
    };
  }

  if (
    hasReachedMaxRedemptions(
      promotionCode.max_redemptions,
      promotionCode.times_redeemed
    )
  ) {
    return {
      valid: false,
      error: "This promotion code has reached its redemption limit",
    };
  }

  return {
    valid: true,
    discountInfo: {
      id: promotionCode.id,
      code: promotionCode.code || "",
      couponId: coupon.id,
      discountType: coupon.percent_off ? "percentage" : "fixed",
      discountValue: calculateDiscountValue(
        coupon.percent_off,
        coupon.amount_off
      ),
      name: coupon.name || coupon.id,
    },
  };
};

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Promotion code is required" },
        { status: 400 }
      );
    }

    try {
      const result = await validatePromotionCode(code);

      if (!result.valid) {
        return NextResponse.json(result, { status: 200 });
      }

      return NextResponse.json(
        { valid: true, ...result.discountInfo },
        { status: 200 }
      );
    } catch (error) {
      console.error("Error validating promotion code:", error);
      return NextResponse.json(
        {
          valid: false,
          error: "Failed to validate promotion code",
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error in validate-promo-code route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
