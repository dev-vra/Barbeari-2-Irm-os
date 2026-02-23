export function validateCpf(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11 || /^(\d)\1{10}$/.test(clean)) return false;

  const calc = (digits: string, factor: number): number => {
    let sum = 0;
    for (const d of digits) sum += parseInt(d) * factor--;
    const remainder = (sum * 10) % 11;
    return remainder >= 10 ? 0 : remainder;
  };

  const d1 = calc(clean.slice(0, 9), 10);
  const d2 = calc(clean.slice(0, 10), 11);

  return d1 === parseInt(clean[9]) && d2 === parseInt(clean[10]);
}

export function formatCpf(cpf: string): string {
  const clean = cpf.replace(/\D/g, '');
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function isCpfIdentifier(identifier: string): boolean {
  return /^\d{11}$/.test(identifier.replace(/\D/g, ''));
}
