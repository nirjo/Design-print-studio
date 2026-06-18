export const BRAND = {
  name: "Aiel Design & Printing Studio",
  tagline: "Bring Your Ideas to Life",
  phone: "+91 91502 34277",
  phoneRaw: "919150234277",
  email: "aielenterprises3321@gmail.com",
  location: "Puducherry, India",
  gst: "34GIQPS9151C",
  assets: {
    nameboard: "https://customer-assets.emergentagent.com/job_b4501b93-3a10-4b2f-a3c7-52838db34c7b/artifacts/av4rfjdw_NameBoard.png",
    circular: "https://customer-assets.emergentagent.com/job_b4501b93-3a10-4b2f-a3c7-52838db34c7b/artifacts/a9hyb92e_Circular%20logo.png",
    banner: "https://customer-assets.emergentagent.com/job_b4501b93-3a10-4b2f-a3c7-52838db34c7b/artifacts/c1indlcw_aiel-banner.png",
  },
};

export function buildWhatsAppLink(message) {
  return `https://wa.me/${BRAND.phoneRaw}?text=${encodeURIComponent(message)}`;
}

export function formatCartMessage(items, customer = {}) {
  const lines = [];
  lines.push(`*New Order — ${BRAND.name}*`);
  lines.push("");
  if (customer.name) lines.push(`Name: ${customer.name}`);
  if (customer.phone) lines.push(`Phone: ${customer.phone}`);
  if (customer.address) lines.push(`Address: ${customer.address}`);
  lines.push("");
  lines.push("*Items:*");
  let total = 0;
  items.forEach((it, idx) => {
    const line = `${idx + 1}. ${it.product_name} — ${it.color} / ${it.size} / ${it.print_area} × ${it.quantity} @ ₹${it.unit_price} = ₹${it.unit_price * it.quantity}`;
    lines.push(line);
    if (it.notes) lines.push(`   Notes: ${it.notes}`);
    total += it.unit_price * it.quantity;
  });
  lines.push("");
  lines.push(`*Total: ₹${total}*`);
  lines.push("");
  lines.push("Please confirm availability and lead time. Thanks!");
  return lines.join("\n");
}
