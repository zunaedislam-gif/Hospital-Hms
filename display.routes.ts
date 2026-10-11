/**
 * Pattern HMS - Public Waiting Room Display Service
 * High-visibility TV display feeds showing chamber-by-chamber current serving tokens,
 * upcoming queues, doctor availability status (including Prayer Breaks),
 * and audio chime triggers.
 */
import { Router, Request, Response } from 'express';
import { db } from '../db/store.js';

const router = Router();

router.get('/state', (req: Request, res: Response) => {
  const branchId = req.query.branchId as string || 'br_pch_main';

  // Gather active doctors and chambers
  const chambers = (db.raw.chambers || []).filter(c => !branchId || c.branchId === branchId);
  const doctors = db.raw.doctors || [];
  const queueEntries = (db.raw.queueEntries || []).filter(q => !branchId || q.branchId === branchId);
  const doctorAvailabilities = db.raw.doctorAvailabilities || [];

  const displayFeed = doctors.map(doc => {
    const chamber = chambers.find(c => c.id === doc.chamberId);
    const chamberNumber = chamber ? chamber.number : '101';
    const chamberName = chamber ? chamber.name : 'Chamber ' + chamberNumber;

    // Doctor availability
    const avail = doctorAvailabilities.find(a => a.doctorId === doc.id) || {
      status: (doc.status as any) || 'AVAILABLE',
      breakType: null,
      expectedReturnTime: null,
      breakNotes: null
    };

    // Current token for this doctor
    const currentEntry = queueEntries.find(q => 
      (q.doctorId === doc.id || q.doctorName?.includes(doc.fullName)) &&
      (q.status === 'CALLED' || q.status === 'IN_CONSULTATION')
    );

    // Upcoming next 4 waiting tokens for this doctor
    const upcomingEntries = queueEntries
      .filter(q => (q.doctorId === doc.id || q.doctorName?.includes(doc.fullName)) && q.status === 'WAITING')
      .sort((a, b) => {
        if (a.isEmergency && !b.isEmergency) return -1;
        if (!a.isEmergency && b.isEmergency) return 1;
        return a.sequenceNumber - b.sequenceNumber;
      })
      .slice(0, 4)
      .map(q => ({
        tokenNumber: q.tokenNumber,
        isEmergency: Boolean(q.isEmergency),
        priority: q.priority
      }));

    return {
      doctorId: doc.id,
      doctorName: doc.fullName,
      specialtyName: doc.specialtyName,
      chamberNumber,
      chamberName,
      status: avail.status,
      breakType: avail.breakType,
      expectedReturnTime: avail.expectedReturnTime,
      breakNotes: avail.breakNotes,
      currentServingToken: currentEntry ? currentEntry.tokenNumber : null,
      currentServingStatus: currentEntry ? currentEntry.status : null,
      lastCalledAt: currentEntry?.lastCalledAt || null,
      upcomingTokens: upcomingEntries,
      waitingCount: queueEntries.filter(q => (q.doctorId === doc.id || q.doctorName?.includes(doc.fullName)) && q.status === 'WAITING').length
    };
  });

  // Recent announcement log (last 5 called tokens)
  const recentCalls = queueEntries
    .filter(q => q.lastCalledAt)
    .sort((a, b) => new Date(b.lastCalledAt!).getTime() - new Date(a.lastCalledAt!).getTime())
    .slice(0, 5)
    .map(q => ({
      tokenNumber: q.tokenNumber,
      doctorName: q.doctorName,
      chamberNumber: q.chamberNumber || '101',
      calledAt: q.lastCalledAt
    }));

  return res.json({
    success: true,
    data: {
      chambers: displayFeed,
      recentCalls,
      hospitalName: db.raw.organizations[0]?.name || 'Pattern Central Hospital',
      serverTime: new Date().toISOString()
    }
  });
});

export default router;
