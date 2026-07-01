import Scheduler from "@/components/ui/scheduler";

export const metadata = { title: "Book a Strategy Session — CyberCraft360" };

export default function BookPage() {
  return (
    <div style={{ minHeight:"100vh", background:"#0a0c12", display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 20px", fontFamily:"system-ui" }}>
      <div style={{ width:"100%", maxWidth:460 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(255,255,255,0.25)", margin:"0 0 10px" }}>CyberCraft360</p>
          <h1 style={{ fontSize:32, fontWeight:300, color:"#fff", margin:"0 0 10px", fontFamily:"Georgia,serif", lineHeight:1.2 }}>
            Free <em>AI Strategy</em> Session
          </h1>
          <p style={{ fontSize:14, color:"rgba(255,255,255,0.4)", margin:0 }}>
            30 minutes. No pitch deck. Just clear answers about what AI can do for your business.
          </p>
        </div>
        <Scheduler />
        <p style={{ textAlign:"center", marginTop:20, fontSize:11, color:"rgba(255,255,255,0.15)" }}>
          © CyberCraft360 · Houston, TX
        </p>
      </div>
    </div>
  );
}
