# Profile Ad Slot Configuration

The public profile page renders the shared RoomKhoj AdSense placement for every user profile.

Required Vercel Preview/Production environment variable:
- `NEXT_PUBLIC_ADSENSE_PROFILE_SLOT`: the numeric AdSense ad-unit slot ID created in the RoomKhoj AdSense account.

The AdSense loader is already included in the root application layout with publisher client `ca-pub-4155800281448057`. The profile placement stays hidden until the ad-unit slot ID is configured. Do not use a guessed slot ID.

This is the RoomKhoj-managed profile placement. It does not attribute earnings to individual creators. Creator-owned AdSense for Platforms requires a separately approved Google AFP integration. Profile/video application approval alone never activates ads or creator earnings.
