/**
 * Email template for welcome email after subscription confirmation
 */

interface WelcomeEmailData {
  firstName?: string;
  discountCode?: string;
  unsubscribeUrl: string;
  language?: string;
}

/**
 * Generates HTML content for the welcome email
 */
export function generateWelcomeEmailHtml(data: WelcomeEmailData): string {
  const { firstName, discountCode, unsubscribeUrl, language = 'sl' } = data;
  
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
  
  // Determine title based on language
  const title = (() => {
    if (language === 'sl') return 'Dobrodošli v družini Kmetije Maroša!';
    if (language === 'en') return 'Welcome to the Kmetija Maroša Family!';
    if (language === 'de') return 'Willkommen in der Kmetija Maroša Familie!';
    if (language === 'hr') return 'Dobrodošli u obitelj Kmetije Maroša!';
    return 'Welcome to the Kmetija Maroša Family!';
  })();
  
  // Determine content text based on language
  const contentText = (() => {
    if (language === 'sl') {
      return `
        <p>Hvala, da ste potrdili prijavo na naše e-novice.</p>
        <p>Veseli nas, da ste se nam pridružili. Redno vas bomo obveščali o:</p>
        <ul>
          <li>Novih ekoloških izdelkih</li>
          <li>Sezonskih ponudbah in popustih</li>
          <li>Receptih in nasvetih za zdravo prehrano</li>
          <li>Dogodkih na naši kmetiji</li>
        </ul>
      `;
    } else if (language === 'en') {
      return `
        <p>Thank you for confirming your subscription to our newsletter.</p>
        <p>We're delighted to have you join us. We'll keep you regularly updated about:</p>
        <ul>
          <li>New organic products</li>
          <li>Seasonal offers and discounts</li>
          <li>Recipes and healthy eating tips</li>
          <li>Events at our farm</li>
        </ul>
      `;
    } else if (language === 'de') {
      return `
        <p>Vielen Dank für die Bestätigung Ihres Newsletter-Abonnements.</p>
        <p>Wir freuen uns, dass Sie sich uns angeschlossen haben. Wir werden Sie regelmäßig über Folgendes informieren:</p>
        <ul>
          <li>Neue Bio-Produkte</li>
          <li>Saisonale Angebote und Rabatte</li>
          <li>Rezepte und Tipps für gesunde Ernährung</li>
          <li>Veranstaltungen auf unserem Bauernhof</li>
        </ul>
      `;
    } else if (language === 'hr') {
      return `
        <p>Hvala što ste potvrdili pretplatu na naš bilten.</p>
        <p>Drago nam je što ste nam se pridružili. Redovito ćemo vas obavještavati o:</p>
        <ul>
          <li>Novim organskim proizvodima</li>
          <li>Sezonskim ponudama i popustima</li>
          <li>Receptima i savjetima za zdravu prehranu</li>
          <li>Događanjima na našoj farmi</li>
        </ul>
      `;
    }
    return `
      <p>Thank you for confirming your subscription to our newsletter.</p>
      <p>We're delighted to have you join us. We'll keep you regularly updated about:</p>
      <ul>
        <li>New organic products</li>
        <li>Seasonal offers and discounts</li>
        <li>Recipes and healthy eating tips</li>
        <li>Events at our farm</li>
      </ul>
    `;
  })();
  
  // Discount section if a discount code is provided
  const discountSection = discountCode ? (() => {
    if (language === 'sl') {
      return `
        <div style="background-color: #f8f4e5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #8B4513; margin-top: 0;">Posebna ponudba za vas</h3>
          <p>Kot dobrodošlico vam podarjamo <strong>10% popust</strong> na vaš prvi nakup.</p>
          <p>Uporabite kodo: <strong style="background-color: #fff; padding: 5px 10px; border: 1px dashed #8B4513;">${discountCode}</strong></p>
          <p>Koda je veljavna 30 dni.</p>
        </div>
      `;
    } else if (language === 'en') {
      return `
        <div style="background-color: #f8f4e5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #8B4513; margin-top: 0;">Special Offer for You</h3>
          <p>As a welcome gift, we're giving you a <strong>10% discount</strong> on your first purchase.</p>
          <p>Use code: <strong style="background-color: #fff; padding: 5px 10px; border: 1px dashed #8B4513;">${discountCode}</strong></p>
          <p>This code is valid for 30 days.</p>
        </div>
      `;
    } else if (language === 'de') {
      return `
        <div style="background-color: #f8f4e5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #8B4513; margin-top: 0;">Spezielles Angebot für Sie</h3>
          <p>Als Willkommensgeschenk geben wir Ihnen einen <strong>10% Rabatt</strong> auf Ihren ersten Einkauf.</p>
          <p>Verwenden Sie den Code: <strong style="background-color: #fff; padding: 5px 10px; border: 1px dashed #8B4513;">${discountCode}</strong></p>
          <p>Dieser Code ist 30 Tage gültig.</p>
        </div>
      `;
    } else if (language === 'hr') {
      return `
        <div style="background-color: #f8f4e5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #8B4513; margin-top: 0;">Posebna ponuda za vas</h3>
          <p>Kao dobrodošlicu, dajemo vam <strong>10% popusta</strong> na vašu prvu kupnju.</p>
          <p>Koristite kod: <strong style="background-color: #fff; padding: 5px 10px; border: 1px dashed #8B4513;">${discountCode}</strong></p>
          <p>Ovaj kod vrijedi 30 dana.</p>
        </div>
      `;
    }
    return `
      <div style="background-color: #f8f4e5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #8B4513; margin-top: 0;">Special Offer for You</h3>
        <p>As a welcome gift, we're giving you a <strong>10% discount</strong> on your first purchase.</p>
        <p>Use code: <strong style="background-color: #fff; padding: 5px 10px; border: 1px dashed #8B4513;">${discountCode}</strong></p>
        <p>This code is valid for 30 days.</p>
      </div>
    `;
  })() : '';
  
  // Determine footer text based on language
  const footerText = (() => {
    if (language === 'sl') {
      return `
        <p>Veselimo se, da vam bomo lahko predstavili naše ekološke izdelke.</p>
        <p>Lep pozdrav,<br>Ekipa Kmetije Maroša</p>
      `;
    } else if (language === 'en') {
      return `
        <p>We look forward to sharing our organic products with you.</p>
        <p>Best regards,<br>The Kmetija Maroša Team</p>
      `;
    } else if (language === 'de') {
      return `
        <p>Wir freuen uns darauf, Ihnen unsere Bio-Produkte vorzustellen.</p>
        <p>Mit freundlichen Grüßen,<br>Das Kmetija Maroša Team</p>
      `;
    } else if (language === 'hr') {
      return `
        <p>Radujemo se što ćemo s vama podijeliti naše organske proizvode.</p>
        <p>Srdačan pozdrav,<br>Tim Kmetije Maroša</p>
      `;
    }
    return `
      <p>We look forward to sharing our organic products with you.</p>
      <p>Best regards,<br>The Kmetija Maroša Team</p>
    `;
  })();
  
  // Determine unsubscribe text based on language
  const unsubscribeText = (() => {
    if (language === 'sl') return 'Odjava od e-novic';
    if (language === 'en') return 'Unsubscribe from newsletter';
    if (language === 'de') return 'Newsletter abbestellen';
    if (language === 'hr') return 'Odjava od biltena';
    return 'Unsubscribe from newsletter';
  })();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
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
        .unsubscribe {
          text-align: center;
          font-size: 12px;
          color: #999;
          margin-top: 20px;
        }
        .unsubscribe a {
          color: #999;
          text-decoration: underline;
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
          <h1>${title}</h1>
          ${contentText}
          ${discountSection}
          <div style="text-align: center;">
            <a href="https://kmetija-marosa.si" class="button">Obišči našo spletno stran</a>
          </div>
          ${footerText}
          <div class="unsubscribe">
            <a href="${unsubscribeUrl}">${unsubscribeText}</a>
          </div>
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
 * Generates plain text content for the welcome email
 */
export function generateWelcomeEmailText(data: WelcomeEmailData): string {
  const { firstName, discountCode, unsubscribeUrl, language = 'sl' } = data;
  
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
  
  // Determine title based on language
  const title = (() => {
    if (language === 'sl') return 'Dobrodošli v družini Kmetije Maroša!';
    if (language === 'en') return 'Welcome to the Kmetija Maroša Family!';
    if (language === 'de') return 'Willkommen in der Kmetija Maroša Familie!';
    if (language === 'hr') return 'Dobrodošli u obitelj Kmetije Maroša!';
    return 'Welcome to the Kmetija Maroša Family!';
  })();
  
  // Determine content text based on language
  const contentText = (() => {
    if (language === 'sl') {
      return `Hvala, da ste potrdili prijavo na naše e-novice.

Veseli nas, da ste se nam pridružili. Redno vas bomo obveščali o:
- Novih ekoloških izdelkih
- Sezonskih ponudbah in popustih
- Receptih in nasvetih za zdravo prehrano
- Dogodkih na naši kmetiji`;
    } else if (language === 'en') {
      return `Thank you for confirming your subscription to our newsletter.

We're delighted to have you join us. We'll keep you regularly updated about:
- New organic products
- Seasonal offers and discounts
- Recipes and healthy eating tips
- Events at our farm`;
    } else if (language === 'de') {
      return `Vielen Dank für die Bestätigung Ihres Newsletter-Abonnements.

Wir freuen uns, dass Sie sich uns angeschlossen haben. Wir werden Sie regelmäßig über Folgendes informieren:
- Neue Bio-Produkte
- Saisonale Angebote und Rabatte
- Rezepte und Tipps für gesunde Ernährung
- Veranstaltungen auf unserem Bauernhof`;
    } else if (language === 'hr') {
      return `Hvala što ste potvrdili pretplatu na naš bilten.

Drago nam je što ste nam se pridružili. Redovito ćemo vas obavještavati o:
- Novim organskim proizvodima
- Sezonskim ponudama i popustima
- Receptima i savjetima za zdravu prehranu
- Događanjima na našoj farmi`;
    }
    return `Thank you for confirming your subscription to our newsletter.

We're delighted to have you join us. We'll keep you regularly updated about:
- New organic products
- Seasonal offers and discounts
- Recipes and healthy eating tips
- Events at our farm`;
  })();
  
  // Discount section if a discount code is provided
  const discountSection = discountCode ? (() => {
    if (language === 'sl') {
      return `
POSEBNA PONUDBA ZA VAS
Kot dobrodošlico vam podarjamo 10% popust na vaš prvi nakup.
Uporabite kodo: ${discountCode}
Koda je veljavna 30 dni.`;
    } else if (language === 'en') {
      return `
SPECIAL OFFER FOR YOU
As a welcome gift, we're giving you a 10% discount on your first purchase.
Use code: ${discountCode}
This code is valid for 30 days.`;
    } else if (language === 'de') {
      return `
SPEZIELLES ANGEBOT FÜR SIE
Als Willkommensgeschenk geben wir Ihnen einen 10% Rabatt auf Ihren ersten Einkauf.
Verwenden Sie den Code: ${discountCode}
Dieser Code ist 30 Tage gültig.`;
    } else if (language === 'hr') {
      return `
POSEBNA PONUDA ZA VAS
Kao dobrodošlicu, dajemo vam 10% popusta na vašu prvu kupnju.
Koristite kod: ${discountCode}
Ovaj kod vrijedi 30 dana.`;
    }
    return `
SPECIAL OFFER FOR YOU
As a welcome gift, we're giving you a 10% discount on your first purchase.
Use code: ${discountCode}
This code is valid for 30 days.`;
  })() : '';
  
  // Determine footer text based on language
  const footerText = (() => {
    if (language === 'sl') {
      return `Veselimo se, da vam bomo lahko predstavili naše ekološke izdelke.

Lep pozdrav,
Ekipa Kmetije Maroša`;
    } else if (language === 'en') {
      return `We look forward to sharing our organic products with you.

Best regards,
The Kmetija Maroša Team`;
    } else if (language === 'de') {
      return `Wir freuen uns darauf, Ihnen unsere Bio-Produkte vorzustellen.

Mit freundlichen Grüßen,
Das Kmetija Maroša Team`;
    } else if (language === 'hr') {
      return `Radujemo se što ćemo s vama podijeliti naše organske proizvode.

Srdačan pozdrav,
Tim Kmetije Maroša`;
    }
    return `We look forward to sharing our organic products with you.

Best regards,
The Kmetija Maroša Team`;
  })();
  
  // Determine unsubscribe text based on language
  const unsubscribeText = (() => {
    if (language === 'sl') return 'Odjava od e-novic';
    if (language === 'en') return 'Unsubscribe from newsletter';
    if (language === 'de') return 'Newsletter abbestellen';
    if (language === 'hr') return 'Odjava od biltena';
    return 'Unsubscribe from newsletter';
  })();

  return `${greeting}

${title}

${contentText}

${discountSection}

Obišči našo spletno stran: https://kmetija-marosa.si

${footerText}

${unsubscribeText}: ${unsubscribeUrl}

© ${new Date().getFullYear()} Kmetija Maroša. All rights reserved.`;
}
