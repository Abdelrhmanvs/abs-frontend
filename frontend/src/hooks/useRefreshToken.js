import axios from "../api/axios";
import useAuth from "./useAuth";

const useRefreshToken = () => {
  const { setAuth } = useAuth();

  const refresh = async () => {
    try {
      const response = await axios.get("auth/refresh", {
        withCredentials: true,
      });
      setAuth((prev) => {
        console.log(JSON.stringify(prev));
        console.log(response.data);
        return {
          ...prev,
          id: response.data.id,
          user: response.data.email,
          roles: response.data.roles,
          accessToken: response.data.accessToken,
        };
      });
      return response.data.accessToken;
    } catch (err) {
      console.error(err);
    }
  };
  return refresh;
};

export default useRefreshToken;
