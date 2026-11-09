/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — VISITOR COMMAND PARSER (LAPIS 2)
 * 
 * Strict command parser for visitor interaction console.
 * Handles /bangunkan, /kopi, /pizza, /lembur, /pesta, and /tanya.
 * ============================================================================
 */

import {
  ProjectCrewMember3D,
  VisitorCommandFeedback,
  StudioActivityLog,
} from '../../../types/virtualOffice3D';
import {
  WAKE_UP_REACTIONS,
  COFFEE_REACTIONS,
} from '../../../data/virtualOfficeDialogueBank';

export interface CommandParseResult {
  feedback: VisitorCommandFeedback;
  updatedCrew: ProjectCrewMember3D[];
  activityLog?: StudioActivityLog;
  visualEffect?: 'WAKE_EXCLAMATION' | 'COFFEE_FLOAT' | 'PIZZA_APPEAR' | 'CRUNCH_LIGHT' | 'CONFETTI_BURST';
}

/**
 * Execute a command input string on the crew state.
 */
export function executeVisitorCommand(
  rawInput: string,
  crewList: ProjectCrewMember3D[],
  focusedRoomProjectId?: string | null
): CommandParseResult {
  const cleanInput = rawInput.trim().toLowerCase();
  const now = Date.now();
  const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // Clone crew list to avoid unwanted direct mutation
  const updatedCrew = crewList.map((c) => ({ ...c }));

  // Helper to find candidate crew (prioritizes focused room if active)
  const candidateCrew = focusedRoomProjectId
    ? updatedCrew.filter((c) => c.projectId === focusedRoomProjectId)
    : updatedCrew;

  // 1. /bangunkan or bangun
  if (cleanInput.startsWith('/bangun') || cleanInput.startsWith('bangun') || cleanInput.startsWith('/tepuk') || cleanInput.startsWith('tepuk')) {
    // Find a crew member who is sleeping or idling, or pick random candidate
    let target = candidateCrew.find((c) => c.isSleeping || c.currentState === 'SLEEPING');
    if (!target) {
      target = candidateCrew[Math.floor(Math.random() * candidateCrew.length)] || updatedCrew[0];
    }

    if (target) {
      target.isSleeping = false;
      target.currentState = 'WORKING_AT_DESK';
      const reaction = WAKE_UP_REACTIONS[Math.floor(Math.random() * WAKE_UP_REACTIONS.length)];
      target.currentActivityLog = 'Terbangun kaget dan kembali mengetik kode!';
      target.activeChatBubble = {
        id: `bubble_${now}`,
        speakerId: target.id,
        speakerName: target.name,
        text: reaction,
        type: 'action',
        createdAt: now,
        durationMs: 4500,
        worldPos: [...target.currentPos],
      };

      const feedback: VisitorCommandFeedback = {
        success: true,
        command: rawInput,
        message: `Kamu menepuk ${target.name}! Ia melonjak kaget dan langsung kembali bekerja.`,
        targetCrewName: target.name,
        actionType: 'WAKE_UP',
        timestamp,
      };

      return {
        feedback,
        updatedCrew,
        visualEffect: 'WAKE_EXCLAMATION',
        activityLog: {
          id: `log_${now}`,
          timestamp,
          projectId: target.projectId,
          projectName: target.projectName,
          crewName: target.name,
          message: `[Interaksi Pengunjung] Menepuk pundak ${target.name} — langsung kembali bekerja.`,
          type: 'command',
        },
      };
    }
  }

  // 2. /kopi or traktir-kopi
  if (cleanInput.startsWith('/kopi') || cleanInput.startsWith('kopi') || cleanInput.startsWith('/coffee') || cleanInput.includes('traktir')) {
    const target = candidateCrew[Math.floor(Math.random() * candidateCrew.length)] || updatedCrew[0];
    if (target) {
      target.speedBuffUntil = now + 20000; // 20s speed buff
      const reaction = COFFEE_REACTIONS[Math.floor(Math.random() * COFFEE_REACTIONS.length)];
      target.currentActivityLog = 'Menikmati kopi hangat (+50% SPD)';
      target.activeChatBubble = {
        id: `bubble_${now}`,
        speakerId: target.id,
        speakerName: target.name,
        text: reaction,
        type: 'speech',
        createdAt: now,
        durationMs: 5000,
        worldPos: [...target.currentPos],
      };

      return {
        feedback: {
          success: true,
          command: rawInput,
          message: `Kamu mentraktir kopi hangat untuk ${target.name}! Kecepatan kerjanya melonjak tajam.`,
          targetCrewName: target.name,
          actionType: 'SERVE_COFFEE',
          timestamp,
        },
        updatedCrew,
        visualEffect: 'COFFEE_FLOAT',
        activityLog: {
          id: `log_${now}`,
          timestamp,
          projectId: target.projectId,
          projectName: target.projectName,
          crewName: target.name,
          message: `[Interaksi Pengunjung] Mentraktir kopi hangat ke ${target.name} (+50% SPD).`,
          type: 'command',
        },
      };
    }
  }

  // 3. /pizza or snack
  if (cleanInput.startsWith('/pizza') || cleanInput.startsWith('pizza') || cleanInput.includes('snack')) {
    // Send pizza to plaza and prompt 2 walking crew
    const nonWorking = candidateCrew.filter((c) => c.currentState !== 'WORKING_AT_DESK');
    const diners = nonWorking.length > 0 ? nonWorking.slice(0, 2) : candidateCrew.slice(0, 2);

    diners.forEach((d) => {
      d.currentState = 'AT_LOUNGE';
      d.currentActivityLog = 'Makan pizza bersama rekan di Collaboration Lounge';
      d.activeChatBubble = {
        id: `bubble_${now}_${d.id}`,
        speakerId: d.id,
        speakerName: d.name,
        text: '🍕 Asyik ada traktiran pizza di lounge! Terima kasih pengunjung baik hati!',
        type: 'speech',
        createdAt: now,
        durationMs: 5000,
        worldPos: [...d.currentPos],
      };
    });

    return {
      feedback: {
        success: true,
        command: rawInput,
        message: `Seloyang pizza lezat telah tiba di Collaboration Lounge! Kru berkumpul menikmati snack.`,
        actionType: 'ORDER_PIZZA',
        timestamp,
      },
      updatedCrew,
      visualEffect: 'PIZZA_APPEAR',
      activityLog: {
        id: `log_${now}`,
        timestamp,
        crewName: 'Tim Studio',
        message: `[Interaksi Pengunjung] Mengirim seloyang pizza ke Collaboration Lounge.`,
        type: 'command',
      },
    };
  }

  // 4. /lembur or crunch
  if (cleanInput.startsWith('/lembur') || cleanInput.startsWith('lembur') || cleanInput.includes('crunch')) {
    candidateCrew.forEach((c) => {
      c.currentState = 'WORKING_AT_DESK';
      c.isSleeping = false;
      c.currentActivityLog = 'Mode lembur fokus tinggi: sprint fitur rilis!';
    });

    const lead = candidateCrew[0] || updatedCrew[0];
    if (lead) {
      lead.activeChatBubble = {
        id: `bubble_${now}`,
        speakerId: lead.id,
        speakerName: lead.name,
        text: '⚡ Mode lembur aktif! Seluruh kru fokus menuntaskan target milestone!',
        type: 'action',
        createdAt: now,
        durationMs: 4000,
        worldPos: [...lead.currentPos],
      };
    }

    return {
      feedback: {
        success: true,
        command: rawInput,
        message: `Mode Lembur diaktifkan! Semua monitor berpendar biru dan kru fokus 100%.`,
        actionType: 'CRUNCH_MODE',
        timestamp,
      },
      updatedCrew,
      visualEffect: 'CRUNCH_LIGHT',
      activityLog: {
        id: `log_${now}`,
        timestamp,
        crewName: 'Tim Proyek',
        message: `[Interaksi Pengunjung] Mode lembur aktif untuk tim.`,
        type: 'command',
      },
    };
  }

  // 5. /pesta or celebrate or rilis
  if (cleanInput.startsWith('/pesta') || cleanInput.startsWith('pesta') || cleanInput.includes('celebrate') || cleanInput.includes('rilis')) {
    candidateCrew.forEach((c) => {
      c.currentState = 'CELEBRATING';
      c.currentActivityLog = 'Merayakan kesiapan rilis produk!';
    });

    const celebrator = candidateCrew[0] || updatedCrew[0];
    if (celebrator) {
      celebrator.activeChatBubble = {
        id: `bubble_${now}`,
        speakerId: celebrator.id,
        speakerName: celebrator.name,
        text: '🎉 HOREE! Milestone tercapai dan pengujian Google Play tuntas!',
        type: 'action',
        createdAt: now,
        durationMs: 5000,
        worldPos: [...celebrator.currentPos],
      };
    }

    return {
      feedback: {
        success: true,
        command: rawInput,
        message: `Konfeti meledak! Kru merayakan kesiapan rilis Google Play dengan sorak sorai!`,
        actionType: 'PARTY_CONFETTI',
        timestamp,
      },
      updatedCrew,
      visualEffect: 'CONFETTI_BURST',
      activityLog: {
        id: `log_${now}`,
        timestamp,
        crewName: 'Tim Studio',
        message: `[Interaksi Pengunjung] Meledakkan konfeti pesta perayaan rilis!`,
        type: 'command',
      },
    };
  }

  // 6. /tanya or status
  if (cleanInput.startsWith('/tanya') || cleanInput.startsWith('tanya') || cleanInput.includes('status')) {
    const target = candidateCrew[Math.floor(Math.random() * candidateCrew.length)] || updatedCrew[0];
    if (target) {
      target.activeChatBubble = {
        id: `bubble_${now}`,
        speakerId: target.id,
        speakerName: target.name,
        text: `💬 Halo! Di proyek ${target.projectName}, saat ini aku sedang: ${target.currentActivityLog}.`,
        type: 'speech',
        createdAt: now,
        durationMs: 6000,
        worldPos: [...target.currentPos],
      };

      return {
        feedback: {
          success: true,
          command: rawInput,
          message: `${target.name} menjawab: "Saat ini aku sedang: ${target.currentActivityLog}."`,
          targetCrewName: target.name,
          actionType: 'QUERY_STATUS',
          timestamp,
        },
        updatedCrew,
        activityLog: {
          id: `log_${now}`,
          timestamp,
          projectId: target.projectId,
          projectName: target.projectName,
          crewName: target.name,
          message: `[Tanya Pengunjung] Menanyakan status ${target.name} (${target.projectName}).`,
          type: 'dialogue',
        },
      };
    }
  }

  // Unknown command fallback
  return {
    feedback: {
      success: false,
      command: rawInput,
      message: `Perintah "${rawInput}" tidak dikenali. Ketik /bangunkan, /kopi, /pizza, /lembur, atau /pesta.`,
      actionType: 'QUERY_STATUS',
      timestamp,
    },
    updatedCrew,
  };
}
