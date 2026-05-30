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

function fmtDate(dateStr: string, lang: Language): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDate();
  const month = getMonthName(d.getMonth() + 1, lang);
  return `${day} ${month}`;
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

  let balLine: string;
  if (balance === 0) {
    balLine = lang === 'hi' ? 'Hisaab poora ho gaya hai ✅' : 'Account is fully settled ✅';
  } else if (balance < 0) {
    balLine = lang === 'hi'
      ? `Advance mein ₹${fmt(Math.abs(balance))} hai ✅`
      : `Advance balance: ₹${fmt(Math.abs(balance))} ✅`;
  } else {
    balLine = lang === 'hi'
      ? `Kul baaki: ₹${fmt(balance)}`
      : `Total due: ₹${fmt(balance)}`;
  }

  if (lang === 'hi') {
    return `Namaste ${customerName} ji 🙏\n\n${d} ko ${litres} litre doodh diya.\nBill: ₹${fmt(amount)} (₹${fmt(rate)}/litre)\n\n${balLine}\n\nDoodhKhata`;
  }
  return `Hello ${customerName} 🙏\n\n${litres} litres delivered on ${d}.\nBill: ₹${fmt(amount)} (₹${fmt(rate)}/litre)\n\n${balLine}\n\nDoodhKhata`;
}

export function buildPaymentMessage(params: {
  lang: Language;
  customerName: string;
  paymentAmount: number;
  balance: number;
}): string {
  const { lang, customerName, paymentAmount, balance } = params;

  let balLine: string;
  if (balance === 0) {
    balLine = lang === 'hi' ? 'Ab hisaab bilkul barabar hai ✅' : 'Account is now fully clear ✅';
  } else if (balance < 0) {
    balLine = lang === 'hi'
      ? `Advance mein ₹${fmt(Math.abs(balance))} hai ✅`
      : `Advance balance: ₹${fmt(Math.abs(balance))} ✅`;
  } else {
    balLine = lang === 'hi'
      ? `Abhi bhi baaki hai: ₹${fmt(balance)}`
      : `Remaining due: ₹${fmt(balance)}`;
  }

  if (lang === 'hi') {
    return `Namaste ${customerName} ji 🙏\n\n₹${fmt(paymentAmount)} ka bhugtan mil gaya. Shukriya!\n\n${balLine}\n\nDoodhKhata`;
  }
  return `Hello ${customerName} 🙏\n\nPayment of ₹${fmt(paymentAmount)} received. Thank you!\n\n${balLine}\n\nDoodhKhata`;
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

  let balLine: string;
  if (balance === 0) {
    balLine = lang === 'hi' ? 'Hisaab poora ho gaya hai ✅' : 'Account is fully settled ✅';
  } else if (balance < 0) {
    balLine = lang === 'hi'
      ? `Advance mein ₹${fmt(Math.abs(balance))} hai ✅`
      : `Advance balance: ₹${fmt(Math.abs(balance))} ✅`;
  } else {
    balLine = lang === 'hi'
      ? `Kul baaki: ₹${fmt(balance)}`
      : `Total due: ₹${fmt(balance)}`;
  }

  const sorted = entries.slice().sort((a, b) => a.date.localeCompare(b.date));

  if (lang === 'hi') {
    const rows = sorted.map(e => {
      const day = new Date(e.date + 'T00:00:00').getDate();
      return `${day} tarikh - ${e.litres} litre - ₹${fmt(e.amount)}`;
    }).join('\n');

    return `Namaste ${customerName} ji 🙏\n\n${monthName} ${year} ka hisaab:\n\n${rows}\n\nMahine mein kul ${fmt(totalLitres)} litre doodh diya.\nKul bill: ₹${fmt(totalBilled)}\nAapne diye: ₹${fmt(totalPaid)}\n${balLine}\n\nDoodhKhata`;
  }

  const rows = sorted.map(e => {
    const day = new Date(e.date + 'T00:00:00').getDate();
    return `${day}th - ${e.litres} litres - ₹${fmt(e.amount)}`;
  }).join('\n');

  return `Hello ${customerName} 🙏\n\n${monthName} ${year} Statement:\n\n${rows}\n\nTotal ${fmt(totalLitres)} litres delivered this month.\nTotal bill: ₹${fmt(totalBilled)}\nPaid: ₹${fmt(totalPaid)}\n${balLine}\n\nDoodhKhata`;
}
