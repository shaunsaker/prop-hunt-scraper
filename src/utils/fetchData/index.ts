import Axios from 'axios';

export const fetchData = async <T>(url: string): Promise<T> => {
  console.log(`Fetching data from ${url}`);
  const response = await Axios.get(url);
  const data: T = response.data;

  return data;
};
