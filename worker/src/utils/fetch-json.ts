import { Toucan } from "toucan-js";

// Fetch a JSON document from one of the external sources we depend on.
// Keeps the URL, the Sentry extra and the error message for a source together,
// instead of spreading them over separate fetch/check/parse blocks.
export const fetchJson = async <T>(
  sentry: Toucan,
  url: string,
  options: {
    sentryExtra: string;
    errorMessage: string;
  }
): Promise<T> => {
  const response = await fetch(url);

  sentry.setExtra(options.sentryExtra, response);

  if (!response.ok) {
    throw Error(options.errorMessage);
  }

  return response.json<T>();
};
