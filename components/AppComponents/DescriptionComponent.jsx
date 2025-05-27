import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

const DescriptionComponent = ({ description, value = 100, color = "gray" }) => {
  const [showFullDescription, setShowFullDescription] = useState(false);

  const toggleDescription = () => {
    setShowFullDescription((prevDescription) => !prevDescription);
  };

  return (
    <View style={{ paddingHorizontal: 15 }}>
      <Text style={{ textAlign: "center", color: color, lineHeight: 20 }}>
        {showFullDescription
          ? description
          : `${description.slice(0, value)}...`}
      </Text>
      {description?.length > value && (
        <TouchableOpacity onPress={toggleDescription}>
          <Text style={{ textAlign: "center", color: color }}>
            {showFullDescription ? `See Less...` : "See More..."}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default DescriptionComponent;
