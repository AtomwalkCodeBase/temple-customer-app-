import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { ImageBackground, Platform } from "react-native";
import styled from "styled-components/native";
import BookButton from "./BookButton";

const Cards = ({
  // Common props
  type = "temple", // 'temple' or 'service'
  image,
  title,
  subtitle,
  rating,
  price,
  capacity,
  description,
  
  // Temple specific props
  location,
  email,
  timings = [],
  
  // Service specific props
  templeName,
  serviceType,
  
  // Action props
  onBookPress,
  bookButtonText = "Book now",
  
  // Style props
  width,
  showRating = true,
  showPrice = true,
}) => {
  return (
    <Card width={width}>
      {/* Image Section with Rating */}
      <TopImage source={{ uri: image }}>
        {showRating && rating !== undefined && (
          <RatingPill>
            <Ionicons name="star" size={12} color="#fff" />
            <RatingText>{typeof rating === 'number' ? rating.toFixed(1) : rating}</RatingText>
          </RatingPill>
        )}
        {type === "service" && <ImageGradient colors={['transparent', 'rgba(0,0,0,0.8)']} />}
      </TopImage>

      <CardBody>
        {/* Title */}
        <Title numberOfLines={1}>{title}</Title>
        
        {/* Subtitle - Temple name for services, Location for temples */}
        {type === "service" && templeName && (
          <Subtitle numberOfLines={1}>{templeName}</Subtitle>
        )}
        
        {type === "temple" && location && (
          <Row>
            <Ionicons name="location-outline" size={14} color="#6b7280" />
            <Meta numberOfLines={2}>{location}</Meta>
          </Row>
        )}

        {/* Email (Temple only) */}
        {type === "temple" && email && (
          <Row style={{ marginTop: 6 }}>
            <Ionicons name="mail-outline" size={14} color="#6b7280" />
            <Meta numberOfLines={1}>{email}</Meta>
          </Row>
        )}

        {/* Description (Service only) */}
        {type === "service" && description && (
          <Description numberOfLines={2}>{description}</Description>
        )}

        {/* Price and Capacity (Service only) */}
        {type === "service" && (showPrice || capacity) && (
          <PriceCapacityContainer>
            {showPrice && price !== undefined && (
              <PriceText>
                {parseFloat(price) === 0 ? "Free" : `₹${parseFloat(price).toFixed(2)}`}
              </PriceText>
            )}
            {capacity && (
              <CapacityText>Capacity: {capacity}</CapacityText>
            )}
          </PriceCapacityContainer>
        )}

        {/* Timings (Temple only) */}
        {type === "temple" && timings.length > 0 && (
          <>
            <SectionLabel>Temple Timings</SectionLabel>
            <Chips>
              {timings.slice(0, 2).map((timing, index) => (
                <Chip key={index}>
                  <ChipText numberOfLines={1}>{timing}</ChipText>
                </Chip>
              ))}
              {timings.length > 2 && (
                <Chip>
                  <ChipText>+{timings.length - 2} more</ChipText>
                </Chip>
              )}
            </Chips>
          </>
        )}

        {/* Book Button */}
        <BookButton 
          title={bookButtonText} 
          onPress={onBookPress} 
          style={{ marginTop: type === "service" ? 8 : 12 }}
        />
      </CardBody>
    </Card>
  );
};

// Styled Components
const Card = styled.View`
  width: ${props => props.width || '100%'};
  background-color: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  ${Platform.select({
    ios: `
      shadow-color: #000;
      shadow-opacity: 0.08;
      shadow-radius: 12px;
      shadow-offset: 0px 4px;
    `,
    android: `
      elevation: 3;
    `,
  })}
`;

const TopImage = styled(ImageBackground)`
  width: 100%;
  height: 120px;
  overflow: hidden;
`;

const ImageGradient = styled(LinearGradient)`
  position: absolute;
  left: 0;
  right: 0;
  top: 70px;
  height: 50px;
`;

const RatingPill = styled.View`
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(0,0,0,0.45);
  padding: 4px 8px;
  border-radius: 12px;
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

const RatingText = styled.Text`
  color: #fff;
  font-size: 12px;
  font-weight: 700;
`;

const CardBody = styled.View`
  padding: 12px;
`;

const Title = styled.Text`
  font-size: 15px;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 4px;
`;

const Subtitle = styled.Text`
  font-size: 14px;
  color: #4a6da7;
  margin-bottom: 8px;
  font-weight: 500;
`;

const Row = styled.View`
  margin-top: 6px;
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

const Meta = styled.Text`
  flex: 1;
  color: #6b7280;
  font-size: 12px;
`;

const Description = styled.Text`
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
  line-height: 20px;
`;

const PriceCapacityContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const PriceText = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: #4a6da7;
`;

const CapacityText = styled.Text`
  font-size: 14px;
  color: #888;
`;

const SectionLabel = styled.Text`
  margin-top: 10px;
  color: #6b7280;
  font-size: 12px;
  font-weight: 700;
`;

const Chips = styled.View`
  margin-top: 6px;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 6px;
`;

const Chip = styled.View`
  padding: 6px 10px;
  background-color: #eef2ff;
  border-radius: 10px;
`;

const ChipText = styled.Text`
  color: #4338ca;
  font-weight: 700;
  font-size: 12px;
`;

export default Cards;