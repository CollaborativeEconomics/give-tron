import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1>GIVE-TRON</h1>
      <Image src="/logo.png" width={200} height={50} alt="Give-Tron logo" />
      <pre>Under construction...</pre>
    </main>
  );
}
