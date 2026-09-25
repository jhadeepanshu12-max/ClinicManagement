import { Pressable, Text } from "react-native";
import { COLORS } from "../../constants/theme";

export default function PrimaryButton({ title, onPress }: any) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: COLORS.primary,
        height: 52,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>
        {title}
      </Text>
    </Pressable>
  );
}