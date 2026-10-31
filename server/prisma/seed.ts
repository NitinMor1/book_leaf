import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting BookLeaf database seeding...');

  // Clean existing data
  await prisma.ticketMessage.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();

  const defaultPasswordHash = await bcrypt.hash('author123', 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);

  // 1. Create Admin Accounts
  const admin1 = await prisma.user.create({
    data: {
      name: 'Saloni Mourya (BookLeaf Ops)',
      email: 'admin@bookleafpub.com',
      password: adminPasswordHash,
      role: 'ADMIN',
      phone: '+91-11-4567-8900',
      city: 'Delhi',
      joinedDate: new Date('2021-01-10'),
    },
  });

  const admin2 = await prisma.user.create({
    data: {
      name: 'Operations Support Team',
      email: 'support@bookleafpub.com',
      password: adminPasswordHash,
      role: 'ADMIN',
      phone: '+91-11-4567-8901',
      city: 'Delhi',
      joinedDate: new Date('2022-03-01'),
    },
  });

  console.log(' Created Admin accounts: admin@bookleafpub.com / support@bookleafpub.com (password: admin123)');

  // 2. Load Sample Data
  const sampleDataPath = path.resolve(__dirname, '../../sample_data/bookleaf_sample_data.json');
  const rawData = fs.readFileSync(sampleDataPath, 'utf-8');
  const sampleData = JSON.parse(rawData);

  const createdAuthorMap = new Map<string, string>(); // author_id -> db user id

  for (const author of sampleData.authors) {
    const user = await prisma.user.create({
      data: {
        authorId: author.author_id,
        name: author.name,
        email: author.email,
        password: defaultPasswordHash,
        role: 'AUTHOR',
        phone: author.phone,
        city: author.city,
        joinedDate: new Date(author.joined_date),
      },
    });

    createdAuthorMap.set(author.author_id, user.id);

    // Create Books
    for (const b of author.books) {
      await prisma.book.create({
        data: {
          id: b.book_id,
          title: b.title,
          isbn: b.isbn,
          genre: b.genre,
          publicationDate: b.publication_date ? new Date(b.publication_date) : null,
          status: b.status,
          mrp: b.mrp !== null ? Number(b.mrp) : null,
          authorRoyaltyPerCopy: b.author_royalty_per_copy !== null ? Number(b.author_royalty_per_copy) : null,
          totalCopiesSold: b.total_copies_sold || 0,
          totalRoyaltyEarned: b.total_royalty_earned || 0,
          royaltyPaid: b.royalty_paid || 0,
          royaltyPending: b.royalty_pending || 0,
          lastRoyaltyPayoutDate: b.last_royalty_payout_date ? new Date(b.last_royalty_payout_date) : null,
          printPartner: b.print_partner,
          availableOn: JSON.stringify(b.available_on || []),
          authorId: user.id,
        },
      });
    }
  }

  console.log(` Created ${sampleData.authors.length} authors and their respective books.`);

  // 3. Pre-seed demonstration tickets covering multiple categories & priorities
  const priyaUserId = createdAuthorMap.get('AUTH001')!;
  const rohitUserId = createdAuthorMap.get('AUTH002')!;
  const vikramUserId = createdAuthorMap.get('AUTH004')!;
  const kavitaUserId = createdAuthorMap.get('AUTH009')!;

  const t1 = await prisma.ticket.create({
    data: {
      ticketNumber: 1001,
      authorId: priyaUserId,
      bookId: 'BK001',
      subject: 'Pending royalty payout question for Q3',
      description: 'Hi BookLeaf team, I see a pending royalty of ₹3,570 for Whispers of the Ganges. My last payout was on 2025-10-15. Could you please confirm when the next batch will be processed into my HDFC account?',
      category: 'Royalty & Payments',
      aiCategory: 'Royalty & Payments',
      priority: 'High',
      aiPriority: 'High',
      status: 'In Progress',
      assignedToId: admin1.id,
      createdAt: new Date(Date.now() - 36 * 3600 * 1000), // 36 hours ago
      aiDraftResponse: `Dear Priya,\n\nThank you for reaching out regarding your pending royalty of ₹3,570 for 'Whispers of the Ganges'.\n\nAt BookLeaf Publishing, royalties are calculated quarterly and distributed within 45 days following the close of each quarter via bank transfer. Since your last payout was processed on October 15, 2025, the pending amount of ₹3,570 meets our minimum payout threshold of ₹1,000 and is queued for our upcoming quarterly cycle.\n\nOur accounts team is finalizing the batch disbursements this week. You will receive an automated confirmation and reference number once the bank transfer executes.\n\nPlease don't hesitate to write back if you need an itemized platform breakdown.\n\nWarm regards,\nBookLeaf Publishing Operations Team`,
    },
  });

  await prisma.ticketMessage.create({
    data: {
      ticketId: t1.id,
      senderId: admin1.id,
      senderName: admin1.name,
      senderRole: 'ADMIN',
      message: 'Verified bank details on file are up to date with HDFC Bank. Marked for next batch release.',
      isInternal: true,
      createdAt: new Date(Date.now() - 24 * 3600 * 1000),
    },
  });

  await prisma.ticketMessage.create({
    data: {
      ticketId: t1.id,
      senderId: admin1.id,
      senderName: admin1.name,
      senderRole: 'ADMIN',
      message: `Dear Priya,\n\nWe have checked your royalty ledger for 'Whispers of the Ganges'. The pending ₹3,570 is verified and scheduled for release in the upcoming quarterly transfer cycle. We will notify you with the transaction UTR as soon as it clears.\n\nWarm regards,\nSaloni Mourya\nBookLeaf Publishing`,
      isInternal: false,
      createdAt: new Date(Date.now() - 20 * 3600 * 1000),
    },
  });

  const t2 = await prisma.ticket.create({
    data: {
      ticketNumber: 1002,
      authorId: rohitUserId,
      bookId: 'BK003',
      subject: 'Critical: Amazon showing incorrect ISBN for Code & Karma',
      description: 'My book is showing a different ISBN on Amazon than what is printed on the physical copy (978-93-5XXXX-03-5). Readers are complaining about metadata confusion.',
      category: 'ISBN & Metadata Issues',
      aiCategory: 'ISBN & Metadata Issues',
      priority: 'Critical',
      aiPriority: 'Critical',
      status: 'Open',
      createdAt: new Date(Date.now() - 8 * 3600 * 1000), // 8 hours ago
      aiDraftResponse: `Dear Rohit,\n\nThank you for alerting us to this issue immediately. We treat any ISBN or catalog data discrepancy as a critical priority.\n\nWe have escalated this directly to our distribution and production team to audit the Amazon India catalog feed for 'Code & Karma' (ISBN: 978-93-5XXXX-03-5). We are initiating a manual metadata sync with Amazon to correct the listing against our master publisher imprint records.\n\nOur team is actively investigating this and will provide you with a concrete resolution status within 48 hours.\n\nSincerely,\nBookLeaf Publishing Support Team`,
    },
  });

  const t3 = await prisma.ticket.create({
    data: {
      ticketNumber: 1003,
      authorId: vikramUserId,
      bookId: 'BK006',
      subject: 'Defective author copies received - misaligned binding',
      description: 'I received my batch of author copies today for Debugging Life. The binding on 4 copies is completely misaligned and the spine glue is loose. Can I get replacement copies?',
      category: 'Printing & Quality',
      aiCategory: 'Printing & Quality',
      priority: 'High',
      aiPriority: 'High',
      status: 'Open',
      createdAt: new Date(Date.now() - 4 * 3600 * 1000),
      aiDraftResponse: `Dear Vikram,\n\nWe sincerely apologise for the substandard print quality on your author copies of 'Debugging Life'. We take our production standards very seriously and regret that this batch did not meet expectations.\n\nBookLeaf will gladly arrange a complimentary reprint for the defective copies. Could you please reply here with clear photos showing the defective binding and spine? Once verified by our quality assurance team in Delhi, we will expedite a fresh reprint (turnaround 5–7 business days) directly to your Pune address at no charge.\n\nWarm regards,\nBookLeaf Publishing Quality Support`,
    },
  });

  const t4 = await prisma.ticket.create({
    data: {
      ticketNumber: 1004,
      authorId: kavitaUserId,
      bookId: 'BK015',
      subject: 'Status update on Raising Roots typesetting stage',
      description: 'It has been 3 weeks since Raising Roots went into typesetting. Could you give me an ETA on when I will receive the layout proofs for review?',
      category: 'Book Status & Production Updates',
      aiCategory: 'Book Status & Production Updates',
      priority: 'Medium',
      aiPriority: 'Medium',
      status: 'Open',
      createdAt: new Date(Date.now() - 48 * 3600 * 1000), // 48 hours ago (oldest unresolved)
      aiDraftResponse: `Dear Kavita,\n\nThank you for checking in on 'Raising Roots'. We understand your excitement to see your book move into print!\n\nOur typesetting team is currently finalizing the interior layout and typography styling. In our production workflow (Typesetting → Proofreading → ISBN Assignment → Printing), this phase ensures your formatting is flawless before proofs are generated. We expect to dispatch your digital proofs for author review within 3 business days.\n\nThank you for your patience as we craft your book.\n\nWarm regards,\nBookLeaf Publishing Editorial Team`,
    },
  });

  console.log(' Pre-seeded 4 sample tickets showcasing statuses, priorities, internal notes, and AI drafts.');
  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
