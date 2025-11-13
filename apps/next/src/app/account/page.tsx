import { withAuth } from "@workos-inc/authkit-nextjs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function AccountPage() {
  const { user, role, permissions } = await withAuth({ ensureSignedIn: true });

  const userFields = [
    ["First name", user?.firstName],
    ["Last name", user?.lastName],
    ["Email", user?.email],
    role ? ["Role", role] : [],
    permissions ? ["Permissions", permissions] : [],
    ["Id", user?.id],
  ].filter((arr) => arr.length > 0);

  return (
    <>
      <div className="mb-7 flex flex-col gap-2">
        <h1 className="text-center font-bold text-4xl">Account details</h1>
        <p className="text-center text-lg text-muted-foreground">
          Below are your account details
        </p>
      </div>

      {userFields && (
        <div className="flex w-[400px] flex-col justify-center gap-3">
          {userFields.map(([label, value]) => (
            <div className="flex items-center gap-6" key={String(value)}>
              <Label className="w-[100px] font-bold">{label}</Label>

              <div className="flex-1">
                <Input readOnly value={String(value) || ""} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
