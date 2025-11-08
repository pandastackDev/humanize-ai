// override react-native types with react-native-web types
import "react-native";

declare module "react-native" {
  type PressableStateCallbackType = {
    hovered?: boolean;
    focused?: boolean;
  };
  type ViewStyle = {
    transitionProperty?: string;
    transitionDuration?: string;
  };
  type TextProps = {
    accessibilityComponentType?: never;
    accessibilityTraits?: never;
    href?: string;
    hrefAttrs?: {
      rel: "noreferrer";
      target?: "_blank";
    };
  };
  type ViewProps = {
    accessibilityRole?: string;
    href?: string;
    hrefAttrs?: {
      rel: "noreferrer";
      target?: "_blank";
    };
    onClick?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
  };
}
