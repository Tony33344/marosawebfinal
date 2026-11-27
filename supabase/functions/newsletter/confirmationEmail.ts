/**
 * Email template for subscription confirmation
 */

interface ConfirmationEmailData {
  firstName?: string;
  confirmationUrl: string;
  language?: string;
}

/**
 * Generates HTML content for the subscription confirmation email
 */
export function generateConfirmationEmailHtml(data: ConfirmationEmailData): string {
  const { firstName, confirmationUrl, language = 'sl' } = data;
  
  // Determine greeting based on language and whether we have a first name
  const greeting = (() => {
    if (language === 'sl') {
      return firstName ? `Pozdravljeni, ${firstName}!` : 'Pozdravljeni!';
    } else if (language === 'en') {
      return firstName ? `Hello, ${firstName}!` : 'Hello!';
    } else if (language === 'de') {
      return firstName ? `Hallo, ${firstName}!` : 'Hallo!';
    } else if (language === 'hr') {
      return firstName ? `Pozdrav, ${firstName}!` : 'Pozdrav!';
    }
    return firstName ? `Hello, ${firstName}!` : 'Hello!';
  })();
  
  // Determine button text based on language
  const buttonText = (() => {
    if (language === 'sl') return 'Potrdite naročnino';
    if (language === 'en') return 'Confirm Subscription';
    if (language === 'de') return 'Abonnement bestätigen';
    if (language === 'hr') return 'Potvrdi pretplatu';
    return 'Confirm Subscription';
  })();
  
  // Determine content text based on language
  const contentText = (() => {
    if (language === 'sl') {
      return `
        <p>Hvala, da ste se prijavili na e-novice Kmetije Maroša.</p>
        <p>Za dokončanje prijave in potrditev vašega e-poštnega naslova, prosimo kliknite na spodnji gumb:</p>
      `;
    } else if (language === 'en') {
      return `
        <p>Thank you for subscribing to Kmetija Maroša's newsletter.</p>
        <p>To complete your subscription and confirm your email address, please click the button below:</p>
      `;
    } else if (language === 'de') {
      return `
        <p>Vielen Dank für Ihr Abonnement des Newsletters von Kmetija Maroša.</p>
        <p>Um Ihr Abonnement abzuschließen und Ihre E-Mail-Adresse zu bestätigen, klicken Sie bitte auf die Schaltfläche unten:</p>
      `;
    } else if (language === 'hr') {
      return `
        <p>Hvala što ste se pretplatili na bilten Kmetije Maroša.</p>
        <p>Da biste dovršili pretplatu i potvrdili svoju adresu e-pošte, kliknite gumb u nastavku:</p>
      `;
    }
    return `
      <p>Thank you for subscribing to Kmetija Maroša's newsletter.</p>
      <p>To complete your subscription and confirm your email address, please click the button below:</p>
    `;
  })();
  
  // Determine footer text based on language
  const footerText = (() => {
    if (language === 'sl') {
      return `
        <p>Če niste zahtevali te prijave, lahko to sporočilo preprosto ignorirate.</p>
        <p>Lep pozdrav,<br>Ekipa Kmetije Maroša</p>
      `;
    } else if (language === 'en') {
      return `
        <p>If you did not request this subscription, you can simply ignore this message.</p>
        <p>Best regards,<br>The Kmetija Maroša Team</p>
      `;
    } else if (language === 'de') {
      return `
        <p>Wenn Sie dieses Abonnement nicht angefordert haben, können Sie diese Nachricht einfach ignorieren.</p>
        <p>Mit freundlichen Grüßen,<br>Das Kmetija Maroša Team</p>
      `;
    } else if (language === 'hr') {
      return `
        <p>Ako niste zatražili ovu pretplatu, možete jednostavno zanemariti ovu poruku.</p>
        <p>Srdačan pozdrav,<br>Tim Kmetije Maroša</p>
      `;
    }
    return `
      <p>If you did not request this subscription, you can simply ignore this message.</p>
      <p>Best regards,<br>The Kmetija Maroša Team</p>
    `;
  })();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirm Your Subscription</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f9f9f9;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
        }
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 1px solid #eaeaea;
        }
        .logo {
          max-width: 150px;
          height: auto;
        }
        .content {
          padding: 30px 20px;
          background-color: #ffffff;
        }
        .button {
          display: inline-block;
          background-color: #8B4513;
          color: #ffffff !important;
          text-decoration: none;
          padding: 12px 30px;
          border-radius: 4px;
          margin: 20px 0;
          font-weight: bold;
        }
        .button:hover {
          background-color: #6b3100;
        }
        .footer {
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #eaeaea;
        }
        @media only screen and (max-width: 600px) {
          .container {
            width: 100%;
          }
          .content {
            padding: 20px 10px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://marosatest.netlify.app/images/logo.png" alt="Kmetija Maroša" class="logo">
        </div>
        <div class="content">
          <h2>${greeting}</h2>
          ${contentText}
          <div style="text-align: center;">
            <a href="${confirmationUrl}" class="button">${buttonText}</a>
          </div>
          ${footerText}
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Kmetija Maroša. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generates plain text content for the subscription confirmation email
 */
export function generateConfirmationEmailText(data: ConfirmationEmailData): string {
  const { firstName, confirmationUrl, language = 'sl' } = data;
  
  // Determine greeting based on language and whether we have a first name
  const greeting = (() => {
    if (language === 'sl') {
      return firstName ? `Pozdravljeni, ${firstName}!` : 'Pozdravljeni!';
    } else if (language === 'en') {
      return firstName ? `Hello, ${firstName}!` : 'Hello!';
    } else if (language === 'de') {
      return firstName ? `Hallo, ${firstName}!` : 'Hallo!';
    } else if (language === 'hr') {
      return firstName ? `Pozdrav, ${firstName}!` : 'Pozdrav!';
    }
    return firstName ? `Hello, ${firstName}!` : 'Hello!';
  })();
  
  // Determine content text based on language
  const contentText = (() => {
    if (language === 'sl') {
      return `Hvala, da ste se prijavili na e-novice Kmetije Maroša.
Za dokončanje prijave in potrditev vašega e-poštnega naslova, prosimo kliknite na spodnjo povezavo:`;
    } else if (language === 'en') {
      return `Thank you for subscribing to Kmetija Maroša's newsletter.
To complete your subscription and confirm your email address, please click the link below:`;
    } else if (language === 'de') {
      return `Vielen Dank für Ihr Abonnement des Newsletters von Kmetija Maroša.
Um Ihr Abonnement abzuschließen und Ihre E-Mail-Adresse zu bestätigen, klicken Sie bitte auf den Link unten:`;
    } else if (language === 'hr') {
      return `Hvala što ste se pretplatili na bilten Kmetije Maroša.
Da biste dovršili pretplatu i potvrdili svoju adresu e-pošte, kliknite vezu u nastavku:`;
    }
    return `Thank you for subscribing to Kmetija Maroša's newsletter.
To complete your subscription and confirm your email address, please click the link below:`;
  })();
  
  // Determine footer text based on language
  const footerText = (() => {
    if (language === 'sl') {
      return `Če niste zahtevali te prijave, lahko to sporočilo preprosto ignorirate.

Lep pozdrav,
Ekipa Kmetije Maroša`;
    } else if (language === 'en') {
      return `If you did not request this subscription, you can simply ignore this message.

Best regards,
The Kmetija Maroša Team`;
    } else if (language === 'de') {
      return `Wenn Sie dieses Abonnement nicht angefordert haben, können Sie diese Nachricht einfach ignorieren.

Mit freundlichen Grüßen,
Das Kmetija Maroša Team`;
    } else if (language === 'hr') {
      return `Ako niste zatražili ovu pretplatu, možete jednostavno zanemariti ovu poruku.

Srdačan pozdrav,
Tim Kmetije Maroša`;
    }
    return `If you did not request this subscription, you can simply ignore this message.

Best regards,
The Kmetija Maroša Team`;
  })();

  return `${greeting}

${contentText}

${confirmationUrl}

${footerText}

© ${new Date().getFullYear()} Kmetija Maroša. All rights reserved.`;
}
