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

function formatMsgDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function balanceLine(balance: number, lang: Language): string {
  if (balance === 0) return lang === 'hi' ? '✅ Hisaab barabar hai' : '✅ All settled!';
  if (balance < 0) return `✅ Advance: ₹${Math.abs(balance).toFixed(2)}`;
  return lang === 'hi' ? `❗ Kul baaki: ₹${balance.toFixed(2)}` : `❗ Total due: ₹${balance.toFixed(2)}`;
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
  const d = formatMsgDate(date);
  const bal = balanceLine(balance, lang);
  if (lang === 'hi') {
    return `Namaste ${customerName} ji! 🙏\n\nAaj ki delivery:\n📅 ${d}\n🥛 ${litres} litre @ ₹${rate}\n💰 Aaj ka: ₹${amount.toFixed(2)}\n${bal}\n\nDoodhKhata`;
  }
  return `Hello ${customerName}!\n\nToday's delivery:\n📅 ${d}\n🥛 ${litres} litres @ ₹${rate}\n💰 Today's amount: ₹${amount.toFixed(2)}\n${bal}\n\nDoodhKhata`;
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
    return `Namaste ${customerName} ji! 🙏\n\n💰 ₹${paymentAmount.toFixed(2)} ka bhugtan mila! ✅\n${bal}\n\nDoodhKhata`;
  }
  return `Hello ${customerName}!\n\n💰 Payment of ₹${paymentAmount.toFixed(2)} received! ✅\n${bal}\n\nDoodhKhata`;
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

  const rows = entries
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(e => {
      const day = String(new Date(e.date + 'T00:00:00').getDate()).padStart(2, '0');
      return `${day} | ${e.litres}L | ₹${e.amount.toFixed(0)}`;
    })
    .join('\n');

  if (lang === 'hi') {
    return `Namaste ${customerName} ji! 🙏\n\n${monthName} ${year} ka hisaab:\n\nTarikh | Litre | Raqam\n${rows}\n\n📊 Mahine ka summary:\n🥛 Kul dudh: ${totalLitres.toFixed(1)} litre\n💰 Kul bana: ₹${totalBilled.toFixed(2)}\n✅ Aapne diye: ₹${totalPaid.toFixed(2)}\n${bal}\n\nDoodhKhata`;
  }
  return `Hello ${customerName}!\n\n${monthName} ${year} Statement:\n\nDate | Litres | Amount\n${rows}\n\n📊 Monthly Summary:\n🥛 Total milk: ${totalLitres.toFixed(1)} litres\n💰 Total billed: ₹${totalBilled.toFixed(2)}\n✅ Paid: ₹${totalPaid.toFixed(2)}\n${bal}\n\nDoodhKhata`;
}
