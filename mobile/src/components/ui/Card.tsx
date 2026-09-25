import { View } from "react-native";
import { COLORS, SHADOW } from "../../constants/theme";

export default function Card({ children, style }: any) {
  return (
    <View
      style={[
        {
          backgroundColor: COLORS.surface,
          borderRadius: 18,
          padding: 16,
          marginBottom: 14,
          ...SHADOW,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}