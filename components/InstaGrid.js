import * as _ from "lodash";
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import MyImage from "./MyImage";
var { width } = Dimensions.get("window");

const InstaGrid = ({
  data,
  columns,
  onEndReachedThreshold,
  onEndReached,
  loading = false,
  onItemClick,
}) => {
  const groupEveryNthRow = 3;
  const { mainContainer, groupedGridContainer } = styles;
  var currentRow = 0;
  const rowsArray = _.chunk(data, columns);
  var bigImageSide = "right";

  const renderGroupedItem = (row) => {
    console.log(row);
    const smallImage1 = row[0];
    const smallImage2 = row[1];
    const largeImage = row[2];

    if (bigImageSide == "right") {
      bigImageSide = "left";
      return (
        <View style={{ flexDirection: "row" }}>
          <View style={groupedGridContainer}>
            <View style={styles.gridStyle}>
              <MyImage
                style={styles.imageThumbnail}
                sourceObj={smallImage1}
                onPress={() => {
                  onItemClick(smallImage1);
                }}
              />
            </View>
            <View style={styles.gridStyle}>
              <MyImage
                style={styles.imageThumbnail}
                sourceObj={smallImage2}
                onPress={() => {
                  onItemClick(smallImage2);
                }}
              />
            </View>
          </View>
          <View style={styles.gridStyle}>
            <MyImage
              style={styles.imageThumbnailLarge}
              sourceObj={largeImage}
              onPress={() => {
                onItemClick(largeImage);
              }}
            />
          </View>
        </View>
      );
    } else {
      bigImageSide = "right";
      return (
        <View style={{ flexDirection: "row" }}>
          <View style={styles.gridStyle}>
            <MyImage
              style={styles.imageThumbnailLarge}
              sourceObj={largeImage}
              onPress={() => {
                onItemClick(largeImage);
              }}
            />
          </View>
          <View style={groupedGridContainer}>
            <View style={styles.gridStyle}>
              <MyImage
                style={styles.imageThumbnail}
                sourceObj={smallImage1}
                onPress={() => {
                  onItemClick(smallImage1);
                }}
              />
            </View>
            <View style={styles.gridStyle}>
              <MyImage
                style={styles.imageThumbnail}
                sourceObj={smallImage2}
                onPress={() => {
                  onItemClick(smallImage2);
                }}
              />
            </View>
          </View>
        </View>
      );
    }
  };

  const renderSingleItem = (item) => {
    return (
      <View style={styles.gridStyle}>
        <MyImage
          style={styles.imageThumbnail}
          sourceObj={item.media_path}
          onPress={() => {
            onItemClick(item);
          }}
        />
      </View>
    );
  };

  const renderCell = (row) => {
    if (row?.length >= columns && currentRow % groupEveryNthRow == 0) {
      currentRow++;
      return <View>{renderGroupedItem(row)}</View>;
    }
    currentRow++;
    return (
      <View style={{ flexDirection: "row" }}>
        {row.map((item) => {
          console.log(item);
          return renderSingleItem(item);
        })}
      </View>
    );
  };

  const isCloseToBottom = ({
    layoutMeasurement,
    contentOffset,
    contentSize,
  }) => {
    const paddingToBottom = 20;
    return (
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom
    );
  };

  const renderFooter = () => {
    return (
      <View style={{ marginBottom: 16 }}>
        <ActivityIndicator animating size="large" />
      </View>
    );
  };

  return (
    <ScrollView
      scrollEventThrottle={onEndReachedThreshold}
      onScroll={({ nativeEvent }) => {
        if (isCloseToBottom(nativeEvent)) {
          onEndReached();
        }
      }}
    >
      <View style={mainContainer}>
        {rowsArray.map((row) => {
          return renderCell(row);
        })}
      </View>
      {loading && renderFooter()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    width: "100%",
  },
  groupedGridContainer: {
    flexDirection: "column",
    flexWrap: "wrap",
  },
  imageThumbnail: {
    height: width / 3 - 12,
    width: width / 3 - 12,
    resizeMode: "stretch",
    alignSelf: "flex-start",
    justifyContent: "flex-start",
  },
  imageThumbnailLarge: {
    height: width * 0.6 + 12,
    width: width * 0.6 + 12,
    marginLeft: 4,
    resizeMode: "stretch",
    alignSelf: "flex-start",
    justifyContent: "flex-start",
  },
  gridStyle: {
    margin: 4,
  },
});

export default InstaGrid;
