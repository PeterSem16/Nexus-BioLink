interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const { to, subject, html, from } = options;
  
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  const EMAIL_FROM = from || process.env.EMAIL_FROM || "noreply@indexus.sk";
  
  if (!SENDGRID_API_KEY) {
    console.log("[Email Simulation] SendGrid not configured");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`From: ${EMAIL_FROM}`);
    console.log(`Body: ${html.substring(0, 200)}...`);
    return true;
  }
  
  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: EMAIL_FROM },
        subject,
        content: [{ type: "text/html", value: html }]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("SendGrid error:", errorText);
      return false;
    }
    
    console.log(`Email sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}
