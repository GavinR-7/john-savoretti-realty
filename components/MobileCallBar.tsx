/*
  MOBILE CALL BAR — fixed to the bottom of the screen, only on small screens
  (md:hidden). For a local-service business, most traffic is a homeowner on
  their phone; the single highest-converting element you can give them is a
  thumb-sized Call button that's always one tap away.

  ⚠️ "Text us" points at business.smsHref — currently the Nassau office
  landline, which probably can't receive SMS. Swap in a cell or Twilio
  number before launch (flagged in data/site.ts).
*/

import { business } from "@/data/site";

export default function MobileCallBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-white/10 md:hidden">
      <a
        href={business.phoneNassauHref}
        className="flex items-center justify-center gap-2 bg-atlantic py-4 text-sm font-semibold text-white active:bg-channel"
      >
        ☎ Call now
      </a>
      <a
        href={business.smsHref}
        className="flex items-center justify-center gap-2 bg-harbor py-4 text-sm font-semibold text-brass-light active:bg-channel"
      >
        ✉ Text us
      </a>
    </div>
  );
}
