import { storage } from "./storage";
import type { InsertVariableBlock, InsertVariable, InsertVariableKeyword } from "@shared/schema";

const VARIABLE_BLOCKS: InsertVariableBlock[] = [
  { code: "customer", displayName: "Zákazník / Rodička", displayNameEn: "Customer / Mother", icon: "User", priority: 1 },
  { code: "father", displayName: "Otec", displayNameEn: "Father", icon: "UserPlus", priority: 2 },
  { code: "child", displayName: "Dieťa", displayNameEn: "Child", icon: "Baby", priority: 3 },
  { code: "company", displayName: "Spoločnosť", displayNameEn: "Company", icon: "Building2", priority: 4 },
  { code: "contract", displayName: "Zmluva", displayNameEn: "Contract", icon: "FileText", priority: 5 },
  { code: "witness", displayName: "Svedok", displayNameEn: "Witness", icon: "Users", priority: 6 },
  { code: "collaborator", displayName: "Spolupracovník", displayNameEn: "Collaborator", icon: "Briefcase", priority: 7 },
  { code: "hospital", displayName: "Nemocnica", displayNameEn: "Hospital", icon: "Hospital", priority: 8 },
  { code: "invoice", displayName: "Faktúra", displayNameEn: "Invoice", icon: "Receipt", priority: 9 },
  { code: "payment", displayName: "Platba", displayNameEn: "Payment", icon: "CreditCard", priority: 10 },
  { code: "product", displayName: "Produkt", displayNameEn: "Product", icon: "Package", priority: 11 },
  { code: "system", displayName: "Systémové", displayNameEn: "System", icon: "Settings", priority: 100 },
];

const BLOCK_KEYWORDS: Record<string, { keyword: string; locale: string; weight: number }[]> = {
  customer: [
    { keyword: "rodička", locale: "sk", weight: 10 },
    { keyword: "matka", locale: "sk", weight: 8 },
    { keyword: "zákazník", locale: "sk", weight: 5 },
    { keyword: "klient", locale: "sk", weight: 5 },
    { keyword: "rodičky", locale: "sk", weight: 10 },
    { keyword: "rodičke", locale: "sk", weight: 10 },
    { keyword: "rodička výslovne", locale: "sk", weight: 10 },
    { keyword: "mother", locale: "en", weight: 10 },
    { keyword: "customer", locale: "en", weight: 5 },
    { keyword: "client", locale: "en", weight: 5 },
    { keyword: "rodička a otec", locale: "sk", weight: 3 },
    { keyword: "madre", locale: "it", weight: 10 },
    { keyword: "mutter", locale: "de", weight: 10 },
    { keyword: "anya", locale: "hu", weight: 10 },
    { keyword: "mama", locale: "ro", weight: 10 },
    { keyword: "matka", locale: "cs", weight: 10 },
  ],
  father: [
    { keyword: "otec", locale: "sk", weight: 10 },
    { keyword: "otca", locale: "sk", weight: 10 },
    { keyword: "otcovi", locale: "sk", weight: 10 },
    { keyword: "father", locale: "en", weight: 10 },
    { keyword: "padre", locale: "it", weight: 10 },
    { keyword: "vater", locale: "de", weight: 10 },
    { keyword: "apa", locale: "hu", weight: 10 },
    { keyword: "tată", locale: "ro", weight: 10 },
    { keyword: "otec", locale: "cs", weight: 10 },
  ],
  child: [
    { keyword: "dieťa", locale: "sk", weight: 10 },
    { keyword: "dieťaťa", locale: "sk", weight: 10 },
    { keyword: "novorodenec", locale: "sk", weight: 8 },
    { keyword: "child", locale: "en", weight: 10 },
    { keyword: "baby", locale: "en", weight: 8 },
    { keyword: "newborn", locale: "en", weight: 8 },
    { keyword: "bambino", locale: "it", weight: 10 },
    { keyword: "kind", locale: "de", weight: 10 },
    { keyword: "gyermek", locale: "hu", weight: 10 },
    { keyword: "copil", locale: "ro", weight: 10 },
    { keyword: "dítě", locale: "cs", weight: 10 },
  ],
  company: [
    { keyword: "spoločnosť", locale: "sk", weight: 10 },
    { keyword: "firma", locale: "sk", weight: 8 },
    { keyword: "cbc ag", locale: "sk", weight: 15 },
    { keyword: "cord blood center", locale: "sk", weight: 15 },
    { keyword: "s.r.p.k.b", locale: "sk", weight: 12 },
    { keyword: "company", locale: "en", weight: 10 },
    { keyword: "corporation", locale: "en", weight: 8 },
    { keyword: "società", locale: "it", weight: 10 },
    { keyword: "gesellschaft", locale: "de", weight: 10 },
    { keyword: "cég", locale: "hu", weight: 10 },
    { keyword: "companie", locale: "ro", weight: 10 },
    { keyword: "společnost", locale: "cs", weight: 10 },
  ],
  contract: [
    { keyword: "zmluva", locale: "sk", weight: 10 },
    { keyword: "zmluve", locale: "sk", weight: 10 },
    { keyword: "zmluvou", locale: "sk", weight: 10 },
    { keyword: "číslo zmluvy", locale: "sk", weight: 12 },
    { keyword: "dátum zmluvy", locale: "sk", weight: 12 },
    { keyword: "contract", locale: "en", weight: 10 },
    { keyword: "agreement", locale: "en", weight: 8 },
    { keyword: "contratto", locale: "it", weight: 10 },
    { keyword: "vertrag", locale: "de", weight: 10 },
    { keyword: "szerződés", locale: "hu", weight: 10 },
    { keyword: "contract", locale: "ro", weight: 10 },
    { keyword: "smlouva", locale: "cs", weight: 10 },
  ],
  witness: [
    { keyword: "svedok", locale: "sk", weight: 10 },
    { keyword: "svedka", locale: "sk", weight: 10 },
    { keyword: "witness", locale: "en", weight: 10 },
    { keyword: "testimone", locale: "it", weight: 10 },
    { keyword: "zeuge", locale: "de", weight: 10 },
    { keyword: "tanú", locale: "hu", weight: 10 },
    { keyword: "martor", locale: "ro", weight: 10 },
    { keyword: "svědek", locale: "cs", weight: 10 },
  ],
  hospital: [
    { keyword: "nemocnica", locale: "sk", weight: 10 },
    { keyword: "nemocnici", locale: "sk", weight: 10 },
    { keyword: "pôrodnica", locale: "sk", weight: 10 },
    { keyword: "zdravotnícke zariadenie", locale: "sk", weight: 8 },
    { keyword: "hospital", locale: "en", weight: 10 },
    { keyword: "ospedale", locale: "it", weight: 10 },
    { keyword: "krankenhaus", locale: "de", weight: 10 },
    { keyword: "kórház", locale: "hu", weight: 10 },
    { keyword: "spital", locale: "ro", weight: 10 },
    { keyword: "nemocnice", locale: "cs", weight: 10 },
  ],
  payment: [
    { keyword: "platba", locale: "sk", weight: 10 },
    { keyword: "úhrada", locale: "sk", weight: 8 },
    { keyword: "splátka", locale: "sk", weight: 8 },
    { keyword: "iban", locale: "sk", weight: 12 },
    { keyword: "bankový účet", locale: "sk", weight: 10 },
    { keyword: "payment", locale: "en", weight: 10 },
    { keyword: "pagamento", locale: "it", weight: 10 },
    { keyword: "zahlung", locale: "de", weight: 10 },
    { keyword: "fizetés", locale: "hu", weight: 10 },
    { keyword: "plată", locale: "ro", weight: 10 },
    { keyword: "platba", locale: "cs", weight: 10 },
  ],
  product: [
    { keyword: "produkt", locale: "sk", weight: 10 },
    { keyword: "typ produktu", locale: "sk", weight: 12 },
    { keyword: "štandard", locale: "sk", weight: 8 },
    { keyword: "prémium", locale: "sk", weight: 8 },
    { keyword: "product", locale: "en", weight: 10 },
    { keyword: "prodotto", locale: "it", weight: 10 },
    { keyword: "produkt", locale: "de", weight: 10 },
    { keyword: "termék", locale: "hu", weight: 10 },
    { keyword: "produs", locale: "ro", weight: 10 },
    { keyword: "produkt", locale: "cs", weight: 10 },
  ],
  system: [
    { keyword: "dátum", locale: "sk", weight: 5 },
    { keyword: "dnes", locale: "sk", weight: 5 },
    { keyword: "date", locale: "en", weight: 5 },
    { keyword: "today", locale: "en", weight: 5 },
  ],
};

const VARIABLES_BY_BLOCK: Record<string, Omit<InsertVariable, "blockId">[]> = {
  customer: [
    { key: "customer.fullName", label: "Celé meno", labelEn: "Full Name", dataType: "text", example: "Jana Nováková", priority: 1 },
    { key: "customer.firstName", label: "Meno", labelEn: "First Name", dataType: "text", example: "Jana", priority: 2 },
    { key: "customer.lastName", label: "Priezvisko", labelEn: "Last Name", dataType: "text", example: "Nováková", priority: 3 },
    { key: "customer.birthDate", label: "Dátum narodenia", labelEn: "Birth Date", dataType: "date", example: "15.03.1990", priority: 4 },
    { key: "customer.personalId", label: "Rodné číslo", labelEn: "Personal ID", dataType: "text", example: "900315/1234", priority: 5 },
    { key: "customer.permanentAddress", label: "Trvalý pobyt", labelEn: "Permanent Address", dataType: "address", example: "Hlavná 123, 831 01 Bratislava", priority: 6 },
    { key: "customer.correspondenceAddress", label: "Korešpondenčná adresa", labelEn: "Correspondence Address", dataType: "address", example: "Hlavná 123, 831 01 Bratislava", priority: 7 },
    { key: "customer.email", label: "E-mail", labelEn: "Email", dataType: "email", example: "jana.novakova@email.sk", priority: 8 },
    { key: "customer.phone", label: "Telefón", labelEn: "Phone", dataType: "phone", example: "+421 900 123 456", priority: 9 },
    { key: "customer.IBAN", label: "IBAN", labelEn: "IBAN", dataType: "iban", example: "SK89 1100 0000 0012 3456 7890", priority: 10 },
    { key: "customer.nationality", label: "Štátna príslušnosť", labelEn: "Nationality", dataType: "text", example: "slovenská", priority: 11 },
    { key: "customer.idCardNumber", label: "Číslo OP", labelEn: "ID Card Number", dataType: "text", example: "EA123456", priority: 12 },
    { key: "customer.signature", label: "Podpis", labelEn: "Signature", dataType: "text", example: "[podpis]", priority: 13 },
    { key: "customer.signatureDate", label: "Dátum podpisu", labelEn: "Signature Date", dataType: "date", example: "01.01.2026", priority: 14 },
    { key: "customer.signaturePlace", label: "Miesto podpisu", labelEn: "Signature Place", dataType: "text", example: "Bratislava", priority: 15 },
  ],
  father: [
    { key: "father.fullName", label: "Celé meno otca", labelEn: "Father Full Name", dataType: "text", example: "Peter Novák", priority: 1 },
    { key: "father.firstName", label: "Meno otca", labelEn: "Father First Name", dataType: "text", example: "Peter", priority: 2 },
    { key: "father.lastName", label: "Priezvisko otca", labelEn: "Father Last Name", dataType: "text", example: "Novák", priority: 3 },
    { key: "father.birthDate", label: "Dátum narodenia otca", labelEn: "Father Birth Date", dataType: "date", example: "20.06.1988", priority: 4 },
    { key: "father.personalId", label: "Rodné číslo otca", labelEn: "Father Personal ID", dataType: "text", example: "880620/1234", priority: 5 },
    { key: "father.permanentAddress", label: "Trvalý pobyt otca", labelEn: "Father Permanent Address", dataType: "address", example: "Hlavná 123, 831 01 Bratislava", priority: 6 },
    { key: "father.email", label: "E-mail otca", labelEn: "Father Email", dataType: "email", example: "peter.novak@email.sk", priority: 7 },
    { key: "father.phone", label: "Telefón otca", labelEn: "Father Phone", dataType: "phone", example: "+421 901 234 567", priority: 8 },
    { key: "father.signature", label: "Podpis otca", labelEn: "Father Signature", dataType: "text", example: "[podpis]", priority: 9 },
    { key: "father.signatureDate", label: "Dátum podpisu otca", labelEn: "Father Signature Date", dataType: "date", example: "01.01.2026", priority: 10 },
  ],
  child: [
    { key: "child.fullName", label: "Meno dieťaťa", labelEn: "Child Full Name", dataType: "text", example: "Michal Novák", priority: 1 },
    { key: "child.firstName", label: "Meno dieťaťa", labelEn: "Child First Name", dataType: "text", example: "Michal", priority: 2 },
    { key: "child.lastName", label: "Priezvisko dieťaťa", labelEn: "Child Last Name", dataType: "text", example: "Novák", priority: 3 },
    { key: "child.birthDate", label: "Dátum narodenia dieťaťa", labelEn: "Child Birth Date", dataType: "date", example: "01.01.2026", priority: 4 },
    { key: "child.birthPlace", label: "Miesto narodenia", labelEn: "Birth Place", dataType: "text", example: "Bratislava", priority: 5 },
    { key: "child.personalId", label: "Rodné číslo dieťaťa", labelEn: "Child Personal ID", dataType: "text", example: "260101/1234", priority: 6 },
    { key: "child.gender", label: "Pohlavie", labelEn: "Gender", dataType: "text", example: "muž", priority: 7 },
  ],
  company: [
    { key: "company.name", label: "Názov spoločnosti", labelEn: "Company Name", dataType: "text", example: "Cord Blood Center AG", priority: 1 },
    { key: "company.address", label: "Sídlo spoločnosti", labelEn: "Company Address", dataType: "address", example: "Bodenhof 4, 6014 Luzern", priority: 2 },
    { key: "company.registrationNumber", label: "IČO", labelEn: "Registration Number", dataType: "text", example: "12345678", priority: 3 },
    { key: "company.taxId", label: "DIČ", labelEn: "Tax ID", dataType: "text", example: "2012345678", priority: 4 },
    { key: "company.vatNumber", label: "IČ DPH", labelEn: "VAT Number", dataType: "text", example: "SK2012345678", priority: 5 },
    { key: "company.IBAN", label: "IBAN spoločnosti", labelEn: "Company IBAN", dataType: "iban", example: "SK44 1111 0000 0013 8851 9013", priority: 6 },
    { key: "company.bankName", label: "Názov banky", labelEn: "Bank Name", dataType: "text", example: "Tatra banka", priority: 7 },
    { key: "company.phone", label: "Telefón spoločnosti", labelEn: "Company Phone", dataType: "phone", example: "+421 2 1234 5678", priority: 8 },
    { key: "company.email", label: "E-mail spoločnosti", labelEn: "Company Email", dataType: "email", example: "info@cordblood.sk", priority: 9 },
    { key: "company.representative", label: "Zástupca spoločnosti", labelEn: "Company Representative", dataType: "text", example: "Ján Šidlík, MBA", priority: 10 },
  ],
  contract: [
    { key: "contract.number", label: "Číslo zmluvy", labelEn: "Contract Number", dataType: "text", example: "ZML-2026-0001", priority: 1 },
    { key: "contract.date", label: "Dátum zmluvy", labelEn: "Contract Date", dataType: "date", example: "7. januára 2026", priority: 2 },
    { key: "contract.validFrom", label: "Platnosť od", labelEn: "Valid From", dataType: "date", example: "7.1.2026", priority: 3 },
    { key: "contract.validTo", label: "Platnosť do", labelEn: "Valid To", dataType: "date", example: "31.12.2046", priority: 4 },
    { key: "contract.totalAmount", label: "Celková suma", labelEn: "Total Amount", dataType: "number", example: "1 500,00 €", priority: 5 },
    { key: "contract.depositAmount", label: "Záloha", labelEn: "Deposit Amount", dataType: "number", example: "150,00 €", priority: 6 },
    { key: "contract.signaturePlace", label: "Miesto podpisu zmluvy", labelEn: "Contract Signature Place", dataType: "text", example: "Bratislava", priority: 7 },
  ],
  witness: [
    { key: "witness.fullName", label: "Meno svedka", labelEn: "Witness Full Name", dataType: "text", example: "Mária Horváthová", priority: 1 },
    { key: "witness.address", label: "Adresa svedka", labelEn: "Witness Address", dataType: "address", example: "Dlhá 45, 811 02 Bratislava", priority: 2 },
    { key: "witness.signature", label: "Podpis svedka", labelEn: "Witness Signature", dataType: "text", example: "[podpis]", priority: 3 },
  ],
  hospital: [
    { key: "hospital.name", label: "Názov nemocnice", labelEn: "Hospital Name", dataType: "text", example: "Univerzitná nemocnica Bratislava", priority: 1 },
    { key: "hospital.address", label: "Adresa nemocnice", labelEn: "Hospital Address", dataType: "address", example: "Antolská 11, 851 07 Bratislava", priority: 2 },
    { key: "hospital.department", label: "Oddelenie", labelEn: "Department", dataType: "text", example: "Pôrodnica", priority: 3 },
    { key: "hospital.phone", label: "Telefón nemocnice", labelEn: "Hospital Phone", dataType: "phone", example: "+421 2 6867 1111", priority: 4 },
  ],
  payment: [
    { key: "payment.amount", label: "Suma platby", labelEn: "Payment Amount", dataType: "number", example: "150,00 €", priority: 1 },
    { key: "payment.dueDate", label: "Dátum splatnosti", labelEn: "Due Date", dataType: "date", example: "15.02.2026", priority: 2 },
    { key: "payment.variableSymbol", label: "Variabilný symbol", labelEn: "Variable Symbol", dataType: "text", example: "2026000001", priority: 3 },
    { key: "payment.IBAN", label: "IBAN pre platbu", labelEn: "Payment IBAN", dataType: "iban", example: "SK44 1111 0000 0013 8851 9013", priority: 4 },
  ],
  product: [
    { key: "product.name", label: "Názov produktu", labelEn: "Product Name", dataType: "text", example: "Štandard + tkanivo pupočníka", priority: 1 },
    { key: "product.price", label: "Cena produktu", labelEn: "Product Price", dataType: "number", example: "790,00 €", priority: 2 },
    { key: "product.description", label: "Popis produktu", labelEn: "Product Description", dataType: "text", example: "Odber a skladovanie pupočníkovej krvi", priority: 3 },
  ],
  system: [
    { key: "today", label: "Dnešný dátum", labelEn: "Today's Date", dataType: "date", example: "7. 1. 2026", priority: 1 },
    { key: "currentYear", label: "Aktuálny rok", labelEn: "Current Year", dataType: "text", example: "2026", priority: 2 },
  ],
};

export async function seedVariableRegistry(): Promise<void> {
  console.log("[Variable Registry] Starting seed...");
  
  const existingBlocks = await storage.getAllVariableBlocks();
  if (existingBlocks.length > 0) {
    console.log("[Variable Registry] Registry already seeded, skipping...");
    return;
  }

  const blockIdMap: Record<string, string> = {};

  for (const blockData of VARIABLE_BLOCKS) {
    const block = await storage.createVariableBlock(blockData);
    blockIdMap[blockData.code] = block.id;
    console.log(`[Variable Registry] Created block: ${blockData.code}`);
  }

  for (const [blockCode, keywords] of Object.entries(BLOCK_KEYWORDS)) {
    const blockId = blockIdMap[blockCode];
    if (!blockId) continue;

    for (const kw of keywords) {
      await storage.createVariableKeyword({
        blockId,
        keyword: kw.keyword,
        locale: kw.locale,
        weight: kw.weight,
      });
    }
    console.log(`[Variable Registry] Created ${keywords.length} keywords for block: ${blockCode}`);
  }

  for (const [blockCode, vars] of Object.entries(VARIABLES_BY_BLOCK)) {
    const blockId = blockIdMap[blockCode];
    if (!blockId) continue;

    for (const v of vars) {
      await storage.createVariable({
        ...v,
        blockId,
      });
    }
    console.log(`[Variable Registry] Created ${vars.length} variables for block: ${blockCode}`);
  }

  console.log("[Variable Registry] Seed completed successfully!");
}
