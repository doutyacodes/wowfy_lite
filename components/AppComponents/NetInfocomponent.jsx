// NetworkCheck.js
import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

const NetworkCheck = ({ serverUrl }) => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
      // if (!state.isConnected) {
      //   Alert.alert('No Internet Connection', 'Please check your internet connection.');
      // }
    });

    const checkServer = async () => {
      const serverUp = await checkServerStatus(serverUrl);
      // if (!serverUp) {
      //   Alert.alert('Server Down', 'The server is currently unreachable. Please try again later.');
      // }
    };

    checkServer();

    return () => {
      unsubscribe();
    };
  }, [serverUrl]);

  return null;
};

const checkServerStatus = async (url) => {
  try {
    let response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch (error) {
    return false;
  }
};

export default NetworkCheck;
