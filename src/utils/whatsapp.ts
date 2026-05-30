import { Language } from '../i18n/translations';

const MONTH_NAMES_HI = ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
const MONTH_NAMES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function getMonthName(month: number, lang: Language): string {
  return lang === 'hi' ? MONTH_NAMES_HI[month - 1] : MONTH_NAMES_EN[month - 1];
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, '').slice(-10);
  return `https://wa.me/91${cleaned}?text=${encodeURIComponent(message)}`;
}

export function openWhatsApp(phone: string, message: string): void {
  window.open(buildWhatsAppUrl(phone, message), '_blank');
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');
}

function balanceLine(balance: number, lang: Language): string {
  if (balance === 0) return lang === 'hi' ? '✅ Hisaab barabar hai!' : '✅ All settled!';
  if (balance < 0) return lang === 'hi' ? `✅ Advance baaki hai: ₹${fmt(Math.abs(balance))}` : `✅ Advance balance: ₹${fmt(Math.abs(balance))}`;
  return lang === 'hi' ? `❗ Baaki hai: ₹${fmt(balance)}` : `❗ Amount due: ₹${fmt(balance)}`;
}

function fmtDate(dateStr: string, lang: Language): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDate();
  const month = getMonthName(d.getMonth() + 1, lang);
  return lang === 'hi' ? `${day} ${month}` : `${day} ${month}`;
}

export function buildDeliveryMessage(params: {
  lang: Language;
  customerName: string;
  date: string;
  litres: number;
  rate: number;
  amount: number;
  balance: number;
}): string {
  const { lang, customerName, date, litres, rate, amount, balance } = params;
  const d = fmtDate(date, lang);
  const bal = balanceLine(balance, lang);

  if (lang === 'hi') {
    return `Namaste ${customerName} ji! 🙏\n\n📅 ${d} ko ${litres} litre doodh diya\n💵 Rate ₹${fmt(rate)}/L  ·  Bill ₹${fmt(amount)}\n\n${bal}\n\n— DoodhKhata 🥛`;
  }
  return `Hello ${customerName}! 🙏\n\n📅 ${d} — ${litres} litres delivered\n💵 Rate ₹${fmt(rate)}/L  ·  Bill ₹${fmt(amount)}\n\n${bal}\n\n— DoodhKhata 🥛`;
}

export function buildPaymentMessage(params: {
  lang: Language;
  customerName: string;
  paymentAmount: number;
  balance: number;
}): string {
  const { lang, customerName, paymentAmount, balance } = params;
  const bal = balanceLine(balance, lang);

  if (lang === 'hi') {
    return `Namaste ${customerName} ji! 🙏\n\n✅ ₹${fmt(paymentAmount)} ka bhugtan mila. Shukriya!\n\n${bal}\n\n— DoodhKhata 🥛`;
  }
  return `Hello ${customerName}! 🙏\n\n✅ Payment of ₹${fmt(paymentAmount)} received. Thank you!\n\n${bal}\n\n— DoodhKhata 🥛`;
}

export function buildMonthlyMessage(params: {
  lang: Language;
  customerName: string;
  month: number;
  year: number;
  entries: Array<{ date: string; litres: number; amount: number }>;
  totalLitres: number;
  totalBilled: number;
  totalPaid: number;
  balance: number;
}): string {
  const { lang, customerName, month, year, entries, totalLitres, totalBilled, totalPaid, balance } = params;
  const monthName = getMonthName(month, lang);
  const bal = balanceLine(balance, lang);

  const sorted = entries.slice().sort((a, b) => a.date.localeCompare(b.date));

  if (lang === 'hi') {
    const rows = sorted.map(e => {
      const day = new Date(e.date + 'T00:00:00').getDate();
      return `  ${String(day).padStart(2)} tarikh — ${e.litres}L = ₹${fmt(e.amount)}`;
    }).join('\n');

    return `Namaste ${customerName} ji! 🙏\n\n📋 ${monthName} ${year} ka hisaab:\n\n${rows}\n\n———\n🥛 Kul doodh: ${fmt(totalLitres)} litre\n💰 Kul bill: ₹${fmt(totalBilled)}\n✅ Aapne diya: ₹${fmt(totalPaid)}\n${bal}\n\n— DoodhKhata 🥛`;
  }

  const rows = sorted.map(e => {
    const day = new Date(e.date + 'T00:00:00').getDate();
    return `  ${String(day).padStart(2)}th — ${e.litres}L = ₹${fmt(e.amount)}`;
  }).join('\n');

  return `Hello ${customerName}! 🙏\n\n📋 ${monthName} ${year} Statement:\n\n${rows}\n\n———\n🥛 Total milk: ${fmt(totalLitres)} litres\n💰 Total bill: ₹${fmt(totalBilled)}\n✅ Paid: ₹${fmt(totalPaid)}\n${bal}\n\n— DoodhKhata 🥛`;
}
