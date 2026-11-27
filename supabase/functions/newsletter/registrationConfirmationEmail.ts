interface RegistrationConfirmationEmailData {
  fullName?: string;
  confirmationUrl: string;
  language?: string;
}

/**
 * Generates HTML content for the registration confirmation email
 */
export function generateRegistrationConfirmationEmailHtml(data: RegistrationConfirmationEmailData): string {
  const { fullName, confirmationUrl, language = 'sl' } = data;
  
  // Determine greeting based on language and whether we have a full name
  const greeting = (() => {
    if (language === 'sl') {
      return fullName ? `Pozdravljeni, ${fullName}!` : 'Pozdravljeni!';
    } else if (language === 'en') {
      return fullName ? `Hello, ${fullName}!` : 'Hello!';
    } else if (language === 'de') {
      return fullName ? `Hallo, ${fullName}!` : 'Hallo!';
    } else if (language === 'hr') {
      return fullName ? `Pozdrav, ${fullName}!` : 'Pozdrav!';
    }
    return fullName ? `Hello, ${fullName}!` : 'Hello!';
  })();

  // Determine title based on language
  const title = (() => {
    if (language === 'sl') return 'Dobrodošli na Kmetiji Maroša!';
    if (language === 'en') return 'Welcome to Kmetija Maroša!';
    if (language === 'de') return 'Willkommen bei Kmetija Maroša!';
    if (language === 'hr') return 'Dobrodošli u Kmetiju Maroša!';
    return 'Dobrodošli na Kmetiji Maroša!';
  })();

  // Determine content text based on language
  const contentText = (() => {
    if (language === 'sl') {
      return `
        <p>Hvala, da ste se registrirali na spletni strani Kmetije Maroša!</p>
        <p>Vaš račun je bil uspešno ustvarjen in lahko se že prijavite ter začnete nakupovati naše kakovostne izdelke.</p>
        <p>Odkrijte našo ponudbo svežih izdelkov iz naše kmetije v Melinicah.</p>
      `;
    } else if (language === 'en') {
      return `
        <p>Thank you for registering on the Kmetija Maroša website!</p>
        <p>Your account has been successfully created and you can now log in and start shopping our quality products.</p>
        <p>Discover our range of fresh products from our farm in Melinci.</p>
      `;
    } else if (language === 'de') {
      return `
        <p>Vielen Dank für Ihre Registrierung auf der Website von Kmetija Maroša!</p>
        <p>Ihr Konto wurde erfolgreich erstellt und Sie können sich jetzt anmelden und unsere hochwertigen Produkte kaufen.</p>
        <p>Entdecken Sie unser Sortiment an frischen Produkten von unserem Hof in Melinci.</p>
      `;
    } else if (language === 'hr') {
      return `
        <p>Hvala što ste se registrirali na web stranici Kmetije Maroša!</p>
        <p>Vaš račun je uspješno stvoren i sada se možete prijaviti i početi kupovati naše kvalitetne proizvode.</p>
        <p>Otkrijte naš asortiman svježih proizvoda s naše farme u Melincima.</p>
      `;
    }
    return `
      <p>Thank you for registering on the Kmetija Maroša website!</p>
      <p>Your account has been successfully created and you can now log in and start shopping our quality products.</p>
      <p>Discover our range of fresh products from our farm in Melinci.</p>
    `;
  })();

  // Determine button text based on language
  const buttonText = (() => {
    if (language === 'sl') return 'Prijavite se';
    if (language === 'en') return 'Log In';
    if (language === 'de') return 'Anmelden';
    if (language === 'hr') return 'Prijavite se';
    return 'Prijavite se';
  })();

  // Determine footer text based on language
  const footerText = (() => {
    if (language === 'sl') {
      return `
        <p>Veselimo se vašega prvega naročila!</p>
        <p>Lep pozdrav,<br>Ekipa Kmetije Maroša</p>
      `;
    } else if (language === 'en') {
      return `
        <p>We look forward to your first order!</p>
        <p>Best regards,<br>The Kmetija Maroša Team</p>
      `;
    } else if (language === 'de') {
      return `
        <p>Wir freuen uns auf Ihre erste Bestellung!</p>
        <p>Mit freundlichen Grüßen,<br>Das Kmetija Maroša Team</p>
      `;
    } else if (language === 'hr') {
      return `
        <p>Radujemo se vašoj prvoj narudžbi!</p>
        <p>Srdačan pozdrav,<br>Tim Kmetije Maroša</p>
      `;
    }
    return `
      <p>We look forward to your first order!</p>
      <p>Best regards,<br>The Kmetija Maroša Team</p>
    `;
  })();

  return `
<!DOCTYPE html>
<html lang="${language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { max-width: 150px; height: auto; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 10px; margin-bottom: 20px; }
        .button { display: inline-block; background-color: #8B4513; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .button:hover { background-color: #A0522D; }
        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="header">
        <img src="https://marosatest.netlify.app/images/logo.png" alt="Kmetija Maroša" class="logo">
        <h1>${title}</h1>
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
        <p>© ${new Date().getFullYear()} Kmetija Maroša. All rights reserved.</p>
        <p>Melinci 80, 9231 Beltinci, Slovenia</p>
    </div>
</body>
</html>
  `;
}

/**
 * Generates plain text content for the registration confirmation email
 */
export function generateRegistrationConfirmationEmailText(data: RegistrationConfirmationEmailData): string {
  const { fullName, confirmationUrl, language = 'sl' } = data;
  
  // Determine greeting based on language and whether we have a full name
  const greeting = (() => {
    if (language === 'sl') {
      return fullName ? `Pozdravljeni, ${fullName}!` : 'Pozdravljeni!';
    } else if (language === 'en') {
      return fullName ? `Hello, ${fullName}!` : 'Hello!';
    } else if (language === 'de') {
      return fullName ? `Hallo, ${fullName}!` : 'Hallo!';
    } else if (language === 'hr') {
      return fullName ? `Pozdrav, ${fullName}!` : 'Pozdrav!';
    }
    return fullName ? `Hello, ${fullName}!` : 'Hello!';
  })();
  
  // Determine content text based on language
  const contentText = (() => {
    if (language === 'sl') {
      return `Hvala, da ste se registrirali na spletni strani Kmetije Maroša.
Za dokončanje registracije in potrditev vašega e-poštnega naslova, prosimo kliknite na spodnjo povezavo:`;
    } else if (language === 'en') {
      return `Thank you for registering on the Kmetija Maroša website.
To complete your registration and confirm your email address, please click the link below:`;
    } else if (language === 'de') {
      return `Vielen Dank für Ihre Registrierung auf der Website von Kmetija Maroša.
Um Ihre Registrierung abzuschließen und Ihre E-Mail-Adresse zu bestätigen, klicken Sie bitte auf den Link unten:`;
    } else if (language === 'hr') {
      return `Hvala što ste se registrirali na web stranici Kmetije Maroša.
Da biste dovršili registraciju i potvrdili svoju adresu e-pošte, kliknite vezu u nastavku:`;
    }
    return `Thank you for registering on the Kmetija Maroša website.
To complete your registration and confirm your email address, please click the link below:`;
  })();
  
  // Determine footer text based on language
  const footerText = (() => {
    if (language === 'sl') {
      return `Če niste zahtevali te registracije, lahko to sporočilo preprosto ignorirate.

Lep pozdrav,
Ekipa Kmetije Maroša`;
    } else if (language === 'en') {
      return `If you did not request this registration, you can simply ignore this message.

Best regards,
The Kmetija Maroša Team`;
    } else if (language === 'de') {
      return `Wenn Sie diese Registrierung nicht angefordert haben, können Sie diese Nachricht einfach ignorieren.

Mit freundlichen Grüßen,
Das Kmetija Maroša Team`;
    } else if (language === 'hr') {
      return `Ako niste zatražili ovu registraciju, možete jednostavno zanemariti ovu poruku.

Srdačan pozdrav,
Tim Kmetije Maroša`;
    }
    return `If you did not request this registration, you can simply ignore this message.

Best regards,
The Kmetija Maroša Team`;
  })();

  return `${greeting}

${contentText}

${confirmationUrl}

${footerText}

© ${new Date().getFullYear()} Kmetija Maroša. All rights reserved.`;
}
