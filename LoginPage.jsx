import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const P = {
  coral:   { bg: "#FFE8E3", mid: "#FF8A73", text: "#C44B30" },
  violet:  { bg: "#EDE8FF", mid: "#9B84F7", text: "#5B3FBE" },
  sage:    { bg: "#E3F5EB", mid: "#5BC98A", text: "#267A4B" },
  cream:   "#FDFAF6",
  surface: "#FFFFFF",
  border:  "rgba(0,0,0,0.07)",
  text:    "#1A1410",
  textSub: "#6B6259",
  textHint:"#A89D94",
  muted:   "#F5F1EC",
};

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&display=swap');`;

function Field({ label, type, placeholder, value, onChange, autoComplete }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ fontSize:12, fontWeight:600, color:P.textSub, display:"block", marginBottom:5 }}>{label}</label>
      <input
        type={type} placeholder={placeholder} value={value}
        onChange={onChange} autoComplete={autoComplete} required
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width:"100%", padding:"10px 13px", borderRadius:10,
          border:`1.5px solid ${focused ? P.violet.mid : P.border}`,
          fontSize:14, fontFamily:"'Plus Jakarta Sans',sans-serif",
          background:P.cream, color:P.text, outline:"none",
          boxSizing:"border-box", transition:"border-color 0.15s",
        }}
      />
    </div>
  );
}

export default function LoginPage() {
  const [mode, setMode]         = useState("login");
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const { login }               = useAuth();
  const navigate                = useNavigate();
  const location                = useLocation();
  const from                    = location.state?.from?.pathname || "/app";

  const clear = () => setError("");
  const switchMode = (m) => { setMode(m); clear(); setName(""); setEmail(""); setPassword(""); setConfirm(""); };

  const submit = async (e) => {
    e.preventDefault();
    clear();
    if (mode === "register") {
      if (password !== confirm) { setError("Passwords do not match."); return; }
      if (password.length < 8)  { setError("Password must be at least 8 characters."); return; }
    }
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body     = mode === "login" ? { email, password } : { name, email, password };
      const res      = await fetch(endpoint, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong."); setLoading(false); return; }
      login(data.user, data.token);
      navigate(from, { replace:true });
    } catch {
      setError("Network error. Please check your connection.");
      setLoading(false);
    }
  };

  return (
    <>
      <style>{FONTS}</style>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}} body{margin:0}`}</style>
      <div style={{ minHeight:"100vh", background:P.cream, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Plus Jakarta Sans',sans-serif", padding:"24px 16px" }}>
        <div style={{ position:"fixed", top:-140, right:-120, width:440, height:440, borderRadius:"50%", background:P.violet.bg, opacity:0.55, pointerEvents:"none" }} />
        <div style={{ position:"fixed", bottom:-100, left:-80, width:340, height:340, borderRadius:"50%", background:P.coral.bg, opacity:0.55, pointerEvents:"none" }} />
        <div style={{ background:P.surface, borderRadius:20, padding:"36px 32px", width:"100%", maxWidth:420, boxShadow:"0 24px 64px rgba(0,0,0,0.08)", border:`1px solid ${P.border}`, position:"relative", zIndex:1, animation:"fadeUp 0.3s ease both" }}>

          <div style={{ textAlign:"center", marginBottom:28 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${P.coral.mid},${P.violet.mid})`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", boxShadow:`0 6px 20px ${P.coral.mid}40` }}>
              <span style={{ fontSize:22, color:"#fff" }}>✦</span>
            </div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:400, fontFamily:"'Fraunces',serif", letterSpacing:"-0.04em", color:P.text }}>TaskFlow</h1>
            <p style={{ margin:"5px 0 0", fontSize:13, color:P.textSub }}>{mode === "login" ? "Welcome back" : "Create your account"}</p>
          </div>

          <div style={{ display:"flex", background:P.muted, borderRadius:11, padding:4, marginBottom:24 }}>
            {["login","register"].map(m => (
              <button key={m} onClick={() => switchMode(m)} style={{ flex:1, padding:"8px", borderRadius:8, border:"none", fontSize:13, fontWeight:600, fontFamily:"inherit", cursor:"pointer", transition:"all 0.15s", background:mode===m?P.surface:"transparent", color:mode===m?P.text:P.textHint, boxShadow:mode===m?"0 1px 4px rgba(0,0,0,0.08)":"none" }}>
                {m === "login" ? "Log in" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={submit}>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {mode === "register" && <Field label="Full name" type="text" placeholder="Alex Johnson" value={name} onChange={e=>setName(e.target.value)} autoComplete="name" />}
              <Field label="Email" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" />
              <Field label="Password" type="password" placeholder={mode==="register"?"Min. 8 characters":"••••••••"} value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode==="login"?"current-password":"new-password"} />
              {mode === "register" && <Field label="Confirm password" type="password" placeholder="Re-enter password" value={confirm} onChange={e=>setConfirm(e.target.value)} autoComplete="new-password" />}

              {error && <div style={{ fontSize:12, color:P.coral.text, background:P.coral.bg, padding:"9px 13px", borderRadius:9, lineHeight:1.5 }}>{error}</div>}

              <button type="submit" disabled={loading} style={{ width:"100%", padding:"12px", marginTop:4, borderRadius:11, border:"none", background:loading?"#E0DCFF":`linear-gradient(135deg,${P.coral.mid},${P.violet.mid})`, color:loading?P.violet.text:"#fff", cursor:loading?"not-allowed":"pointer", fontSize:14, fontWeight:600, fontFamily:"inherit", boxShadow:loading?"none":`0 4px 16px ${P.coral.mid}40`, transition:"all 0.2s" }}>
                {loading ? "Please wait…" : mode==="login" ? "Log in to TaskFlow" : "Create account ✦"}
              </button>
            </div>
          </form>

          <p style={{ textAlign:"center", marginTop:20, fontSize:12, color:P.textHint }}>
            {mode==="login"
              ? <> No account?{" "}<span onClick={()=>switchMode("register")} style={{ color:P.violet.text, cursor:"pointer", fontWeight:600 }}>Sign up free</span></>
              : <> Already have an account?{" "}<span onClick={()=>switchMode("login")} style={{ color:P.violet.text, cursor:"pointer", fontWeight:600 }}>Log in</span></>
            }
          </p>
        </div>
      </div>
    </>
  );
}
