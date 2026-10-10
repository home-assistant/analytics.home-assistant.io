import { Toucan } from "toucan-js";
import { FETCH_TIMEOUT } from "../data";

export const fetchJson = async <T>(
  sentry: Toucan,
  url: string,
  options: {
    sentryExtra: string;
    errorMessage: string;
  }
): Promise<T> => {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
  });

  sentry.setExtra(options.sentryExtra, response);

  if (!response.ok) {
    throw new Error(options.errorMessage);
  }

  return response.json<T>();
};
