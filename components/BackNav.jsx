import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import styled from 'styled-components/native';

const BackNav = ({ onPress, color = "#FFF", size = 22 }) => {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <BackButton onPress={handlePress}>
      <Ionicons name="chevron-back" size={size} color={color} />
    </BackButton>
  );
};

const BackButton = styled.TouchableOpacity`
  height: 40px;
  width: 40px;
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.2);
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  margin-top: 10px;
`;

export default BackNav;