export interface IntegrationDetails {
  title: string;
  quality_scale: string;
}

export interface IntegrationData {
  domain: string;
  title: string;
  installations: number;
}

export const AnalyticsPages = ["installations", "statistics", "integrations"];

export const fetchData = () => fetch("/data.json");

export const fetchIntegrationDetails = () => fetch("/integration_details.json");

export const relativeTime = (targetTimestamp: number): string => {
  const now = new Date();
  let count = 0;
  let postfix;
  const secondsPast = (now.getTime() - targetTimestamp) / 1000;
  if (secondsPast < 60) {
    postfix = secondsPast === 1 ? "second" : "seconds";
  } else if (secondsPast < 3600) {
    count = Math.round(secondsPast / 60);
    postfix = count === 1 ? "minute" : "minutes";
  } else if (secondsPast < 86400) {
    count = Math.round(secondsPast / 3600);
    postfix = count === 1 ? "hour" : "hours";
  } else if (secondsPast > 86400) {
    count = Math.round(secondsPast / 86400);
    postfix = count === 1 ? "day" : "days";
  }

  return `${count} ${postfix} ago`;
};
