// Sends an interaction record to the register API every time a target is
// detected. Returns a function (target) => void. With an empty URL it does
// nothing, so the experience works without any backend.
export const createRegister = ({ url, interactive, session, fetchFn = (...args) => fetch(...args), userAgent = navigator.userAgent }) => {
  if (!url) return () => {};

  return (target) => {
    fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        interactive,
        target,
        session,
        device: /Mobi|Android/i.test(userAgent) ? 'mobile' : 'desktop',
        os: userAgent,
      }),
    });
  };
};
