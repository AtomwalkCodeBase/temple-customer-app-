import styled from "styled-components/native";

export default function BookButton({
  onPress,
  title = "Book now",
  size = "default", // "small" | "default"
}) {
  return (
    <BookBtn activeOpacity={0.9} onPress={onPress} size={size}>
      <BookText size={size}>{title}</BookText>
    </BookBtn>
  );
}

const BookBtn = styled.TouchableOpacity`
  border-radius: 12px;
  background-color: #e88f14;
  align-items: center;
  justify-content: center;

  /* size variants */
  ${(props) =>
    props.size === "small"
      ? `
        margin-top: 14px;
        align-self: flex-start;
        padding-vertical: 12px;
        padding-horizontal: 18px;
      `
      : `
        margin-top: 12px;
        height: 40px;
        padding-horizontal: 18px;
      `}
`;

const BookText = styled.Text`
  font-weight: 800;
  color: ${(props) => (props.size === "small" ? "#3b2a00" : "#ffffff")};
  font-size: ${(props) => (props.size === "small" ? "14px" : "14px")};
`;
