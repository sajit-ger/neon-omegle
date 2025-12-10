export const metadata = {
  title: "Neon Omegle",
  description: "Spotify Style WebRTC Chat",
};

export default function RootLayout({ children }) {
  return (
    <html>
      <body style={{ margin: 0, background: '#121212' }}>
        {children}
      </body>
    </html>
  );
}
