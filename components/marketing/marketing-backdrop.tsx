/* Decorative textures; plain img avoids eager optimization of eight large blobs */
/* eslint-disable @next/next/no-img-element */

const ORGANIC_SRC = [
  "https://lh3.googleusercontent.com/aida/ADBb0ujVdIHFAvIa4QMHwA6Cb2Kq0LdQdCqalPLLcDgTpHgX8RaKUJZzP00YB0j9YPaZHfw2C-lVXe6KJW7NHCTA1hZfH9rFCGQ-InNHLS_MLYszQSCbxYj3ds38K-irpB70VgNl3pe83IbE6RsMrXqUtNaaT7BlHCZas0fhrh-fmJh56NmZNWJEVQ6m6bUalqDfwMhDjSgvKBPuwE8VQVPPoitwi2YdgfhUXkMCXjXCX6D8vQ_it0tJIoOy_XuuJVglRaD42GI4sNSGBVg",
  "https://lh3.googleusercontent.com/aida/ADBb0uhPMPdvBq27WpKnAGtPOj1AG5e9v5ehMJaNNq0dLLu7AuKcdt_GbNTD7z6wgIUQI-8BoSiI2p3k-68XjZPa_FmCgt7h1sfOBNVw81ITJtZpPzcWHiPk-oCyBqBNYTIKY5oJQdQWTWIiVd6wZZ9lHgBDz-8yeSOI86LNzP6CcS3e0_tdt7xd5tJcIN7FIviymRk011b8lT6NfkH3zQcAAPNqKKB_hMIaA3WzagYXMpoFHJDhUSkQ3NCwtwVkpEKwrauPEN5kS1ukxXY",
  "https://lh3.googleusercontent.com/aida/ADBb0ujKh4NZdfpIhWVouKuUpB9T4IR-g6VNcaJwuPEVpWo5H3isWobnDASn3-1J34V9B0VHpSd5NkzDxklx1uJiT4_nxJDHZJl6MajFONMS9Au8Z3CjOV8HtKdvSjhG-d7oALfDB3vn4dVR1tMCzjiNpZa43Iom_oDZXD2iFQQnmEUloztnqTF2h9wRV6GBvBuMUhtLBA6fMOkYiU7J0Ydtew5fzO8ldoExtORS3LNjL18s1y9DZLcY-yt_zj20_d_GBNTmNJz2cLXHjvI",
  "https://lh3.googleusercontent.com/aida/ADBb0ujJOGK56643HpXetYKUOx3sXPOZtj8tQEHA8PA9i9FlDyT0IxrrPSriMqIGed2efyceIYIpN3FpLzfackZbZ6KEkFumwMWhZhh1ubbG73-GTy8_TPJh4mBZDKCz0SONz6JVvjCl9OxA4TbNs6_dYeSkdkdmLL_mLduU1pLm-Qdm-NtQyOVGLtm7_odd7E2TT_SOtvy8QqMaxkbYTnUNkR6Z20D0EAsWvsnIuYtnjOymnBxw5sETPMytUZ871FbV7vUip17TuRpZBg",
  "https://lh3.googleusercontent.com/aida/ADBb0uj1nUtU_RW5M4EcfQ_9Rq_LU12qjzhIQ7WvB5ARh3WETVPHjzCDtwreLc892xBFFwyPsxQAixkvR7lZvfcRP9GIT0xNdM1QjPTadM0BPEUqkKAbN148FeQNEemNd2IfbKKHsToQ-abX3Fo2VIgyw4hM6vlVERXYrkpixFfDiwIzTxsNuY4CPdlU6EcwyjuxQYrfy3A2TmlHDziSrpygNxUeKbM3JOwR4V62VqQ0xgucmx5E9iIm5lC7Gp5eGp0EXvaWPhngnKUX0Bw",
  "https://lh3.googleusercontent.com/aida/ADBb0ujO2ZnsbGduwTeCanPBk3pk_bpUinFC5G_9uLPeL3Z5WzEn_9AWUZhYwOP6x1q7BytdpdpTG2cadi9v79RLgcMSBcFu_l1pLz5nXS8MjHFzkoMQQReEgbKYnQ5csTYebbupybmPv0pOCe1jpcEeDpE72MtTA4pOYiqBKGQ6kdEmCrWMWN_QvA4sMFepE6jJAJIM6_uv8Gh0X4Cdq_UHxB36mGlLflm449wz6ifLJ7W1iwAedohOO661CD94xwFLegnG9s6M99mK56w",
  "https://lh3.googleusercontent.com/aida/ADBb0ujVdIHFAvIa4QMHwA6Cb2Kq0LdQdCqalPLLcDgTpHgX8RaKUJZzP00YB0j9YPaZHfw2C-lVXe6KJW7NHCTA1hZfH9rFCGQ-InNHLS_MLYszQSCbxYj3ds38K-irpB70VgNl3pe83IbE6RsMrXqUtNaaT7BlHCZas0fhrh-fmJh56NmZNWJEVQ6m6bUalqDfwMhDjSgvKBPuwE8VQVPPoitwi2YdgfhUXkMCXjXCX6D8vQ_it0tJIoOy_XuuJVglRaD42GI4sNSGBVg",
  "https://lh3.googleusercontent.com/aida/ADBb0uhPMPdvBq27WpKnAGtPOj1AG5e9v5ehMJaNNq0dLLu7AuKcdt_GbNTD7z6wgIUQI-8BoSiI2p3k-68XjZPa_FmCgt7h1sfOBNVw81ITJtZpPzcWHiPk-oCyBqBNYTIKY5oJQdQWTWIiVd6wZZ9lHgBDz-8yeSOI86LNzP6CcS3e0_tdt7xd5tJcIN7FIviymRk011b8lT6NfkH3zQcAAPNqKKB_hMIaA3WzagYXMpoFHJDhUSkQ3NCwtwVkpEKwrauPEN5kS1ukxXY",
];

export function MarketingBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden">
      <img
        alt=""
        className="organic-shape absolute -top-[10%] -left-[10%] w-[1000px] rotate-[15deg]"
        src={ORGANIC_SRC[0]}
      />
      <img
        alt=""
        className="organic-shape absolute top-[15%] -right-[15%] w-[800px] scale-x-[-1] rotate-[-12deg]"
        src={ORGANIC_SRC[1]}
      />
      <img
        alt=""
        className="organic-shape absolute top-[30%] -left-[20%] w-[1100px] rotate-[45deg]"
        src={ORGANIC_SRC[2]}
      />
      <img
        alt=""
        className="organic-shape absolute top-[45%] left-[40%] w-[700px] opacity-[0.08]"
        src={ORGANIC_SRC[3]}
      />
      <img
        alt=""
        className="organic-shape absolute top-[60%] -right-[10%] w-[950px] scale-y-[-1] rotate-[-25deg]"
        src={ORGANIC_SRC[4]}
      />
      <img
        alt=""
        className="organic-shape absolute bottom-[10%] -left-[15%] w-[1200px] rotate-[160deg]"
        src={ORGANIC_SRC[5]}
      />
      <img
        alt=""
        className="organic-shape absolute top-[10%] left-[25%] w-[400px] opacity-[0.1]"
        src={ORGANIC_SRC[6]}
      />
      <img
        alt=""
        className="organic-shape absolute right-[10%] bottom-[25%] w-[500px] rotate-[90deg] scale-x-[-1] opacity-[0.1]"
        src={ORGANIC_SRC[7]}
      />
      <div className="vlek bg-japandi-gold absolute top-[-150px] left-[-150px] h-[700px] w-[700px] opacity-10" />
      <div className="vlek bg-japandi-apricot absolute right-[-100px] bottom-[10%] h-[600px] w-[600px] opacity-5" />
    </div>
  );
}
