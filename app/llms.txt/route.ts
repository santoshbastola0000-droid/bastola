const content = `# RoomKhoj

> RoomKhoj is a Nepal-focused platform for discovering rental rooms, flats, houses and approved job vacancies.

## Primary public sections
- https://www.roomkhoj.com/rooms
- https://www.roomkhoj.com/rooms/pokhara
- https://www.roomkhoj.com/jobs
- https://www.roomkhoj.com/jobs/pokhara
- https://www.roomkhoj.com/about
- https://www.roomkhoj.com/contact

## Public discovery
RoomKhoj provides crawlable city, area, budget and job-role landing pages. Individual approved job pages and eligible public social posts may also be indexed.

## Privacy
Public SEO pages do not intentionally publish private phone numbers, email addresses or exact private location coordinates. Use the RoomKhoj application and its access controls for private contact details.

## Languages
Public content may contain English and Nepali.

## Canonical site
https://www.roomkhoj.com/
`;

export function GET() {
  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
