const response = await fetch(
  "https://www.mass.gov/info-details/massgis-data-massachusetts-community-names-lookup-table",
);
const text = await response.text();
console.log("HTTP", response.status);
console.log(text.match(/https?:[^\s"<>]+(?:zip|xlsx|dbf)[^\s"<>]*/g));
