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

  if (lang === 'hi') {
    let balLine: string;
    if (balance === 0)       balLine = 'हिसाब पूरा हो गया है ✅';
    else if (balance < 0)   balLine = `Advance में ₹${fmt(Math.abs(balance))} है ✅`;
    else                     balLine = `कुल बाकी: ₹${fmt(balance)}`;

    return `नमस्ते ${customerName} जी,\n\n${d} को ${litres} लीटर दूध दिया।\nबिल: ₹${fmt(amount)} (₹${fmt(rate)}/लीटर)\n\n${balLine}\n\n- दूधखाता`;
  }

  let balLine: string;
  if (balance === 0)       balLine = 'Account fully settled ✅';
  else if (balance < 0)   balLine = `Advance balance: ₹${fmt(Math.abs(balance))} ✅`;
  else                     balLine = `Total due: ₹${fmt(balance)}`;

  return `Hello ${customerName},\n\n${litres} litres delivered on ${d}.\nBill: ₹${fmt(amount)} (₹${fmt(rate)}/litre)\n\n${balLine}\n\n- DoodhKhata`;
}

export function buildPaymentMessage(params: {
  lang: Language;
  customerName: string;
  paymentAmount: number;
  balance: number;
}): string {
  const { lang, customerName, paymentAmount, balance } = params;

  if (lang === 'hi') {
    let balLine: string;
    if (balance === 0)       balLine = 'अब हिसाब बिल्कुल बराबर है ✅';
    else if (balance < 0)   balLine = `Advance में ₹${fmt(Math.abs(balance))} है ✅`;
    else                     balLine = `अभी भी बाकी है: ₹${fmt(balance)}`;

    return `नमस्ते ${customerName} जी,\n\n₹${fmt(paymentAmount)} का भुगतान मिल गया। शुक्रिया!\n\n${balLine}\n\n- दूधखाता`;
  }

  let balLine: string;
  if (balance === 0)       balLine = 'Account is now fully clear ✅';
  else if (balance < 0)   balLine = `Advance balance: ₹${fmt(Math.abs(balance))} ✅`;
  else                     balLine = `Remaining due: ₹${fmt(balance)}`;

  return `Hello ${customerName},\n\nPayment of ₹${fmt(paymentAmount)} received. Thank you!\n\n${balLine}\n\n- DoodhKhata`;
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
  const sorted = entries.slice().sort((a, b) => a.date.localeCompare(b.date));

  if (lang === 'hi') {
    let balLine: string;
    if (balance === 0)       balLine = 'हिसाब पूरा हो गया है ✅';
    else if (balance < 0)   balLine = `Advance में ₹${fmt(Math.abs(balance))} है ✅`;
    else                     balLine = `कुल बाकी: ₹${fmt(balance)}`;

    const rows = sorted.map(e => {
      const day = new Date(e.date + 'T00:00:00').getDate();
      return `${day} तारीख - ${e.litres} लीटर - ₹${fmt(e.amount)}`;
    }).join('\n');

    return `नमस्ते ${customerName} जी,\n\n${monthName} ${year} का हिसाब:\n\n${rows}\n\nमहीने में कुल ${fmt(totalLitres)} लीटर दूध दिया।\nकुल बिल: ₹${fmt(totalBilled)}\nआपने दिया: ₹${fmt(totalPaid)}\n${balLine}\n\n- दूधखाता`;
  }

  let balLine: string;
  if (balance === 0)       balLine = 'Account fully settled ✅';
  else if (balance < 0)   balLine = `Advance balance: ₹${fmt(Math.abs(balance))} ✅`;
  else                     balLine = `Total due: ₹${fmt(balance)}`;

  const rows = sorted.map(e => {
    const day = new Date(e.date + 'T00:00:00').getDate();
    return `${day}th - ${e.litres} litres - ₹${fmt(e.amount)}`;
  }).join('\n');

  return `Hello ${customerName},\n\n${monthName} ${year} Statement:\n\n${rows}\n\nTotal ${fmt(totalLitres)} litres delivered this month.\nTotal bill: ₹${fmt(totalBilled)}\nPaid: ₹${fmt(totalPaid)}\n${balLine}\n\n- DoodhKhata`;
}
