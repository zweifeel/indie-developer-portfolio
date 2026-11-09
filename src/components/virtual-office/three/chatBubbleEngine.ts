/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — CHAT BUBBLE ENGINE (LAPIS 2)
 * 
 * Manages 3D Thought Bubbles, Proximity Dialogue Exchanges,
 * and Timed Bubble Expiration.
 * ============================================================================
 */

import {
  ProjectCrewMember3D,
} from '../../../types/virtualOffice3D';
import {
  RANDOM_THOUGHT_BUBBLES,
  CASUAL_DIALOGUES,
} from '../../../data/virtualOfficeDialogueBank';

/**
 * Calculate Euclidean distance in X-Z ground plane
 */
export function calculateGroundDistance(
  posA: [number, number, number],
  posB: [number, number, number]
): number {
  const dx = posA[0] - posB[0];
  const dz = posA[2] - posB[2];
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Update and clean expired chat bubbles for all crew members.
 */
export function updateBubbleExpirations(
  crewList: ProjectCrewMember3D[],
  currentTime: number
): ProjectCrewMember3D[] {
  return crewList.map((crew) => {
    if (crew.activeChatBubble) {
      const isExpired = currentTime >= crew.activeChatBubble.createdAt + crew.activeChatBubble.durationMs;
      if (isExpired) {
        return { ...crew, activeChatBubble: null };
      }
      // Update world position with current crew position
      return {
        ...crew,
        activeChatBubble: {
          ...crew.activeChatBubble,
          worldPos: [crew.currentPos[0], crew.currentPos[1] + 2.2, crew.currentPos[2]],
        },
      };
    }
    return crew;
  });
}

/**
 * Periodically evaluate if two nearby walking crew members should talk,
 * or if a working crew member emits a thought bubble.
 */
export function evaluateAutonomousBubbles(
  crewList: ProjectCrewMember3D[],
  currentTime: number
): ProjectCrewMember3D[] {
  const updatedCrew = [...crewList];

  // 1. Proximity Check: pairs of crew members who are within talking distance (< 4 units)
  const walkingCrew = updatedCrew.filter(
    (c) => (c.currentState === 'WALKING' || c.currentState === 'AT_LOUNGE' || c.currentState === 'AT_PANTRY') && !c.activeChatBubble
  );

  for (let i = 0; i < walkingCrew.length; i++) {
    for (let j = i + 1; j < walkingCrew.length; j++) {
      const a = walkingCrew[i];
      const b = walkingCrew[j];
      const dist = calculateGroundDistance(a.currentPos, b.currentPos);

      if (dist < 4.0) {
        // Trigger conversation exchange
        const dialogue = CASUAL_DIALOGUES[Math.floor(Math.random() * CASUAL_DIALOGUES.length)];
        
        a.activeChatBubble = {
          id: `dialogue_${currentTime}_${a.id}`,
          speakerId: a.id,
          speakerName: a.name,
          text: dialogue.speaker,
          type: 'speech',
          createdAt: currentTime,
          durationMs: 4000,
          worldPos: [a.currentPos[0], a.currentPos[1] + 2.2, a.currentPos[2]],
        };

        // B replies with a slight stagger
        b.activeChatBubble = {
          id: `dialogue_${currentTime}_${b.id}`,
          speakerId: b.id,
          speakerName: b.name,
          text: dialogue.reply,
          type: 'speech',
          createdAt: currentTime + 1200,
          durationMs: 4000,
          worldPos: [b.currentPos[0], b.currentPos[1] + 2.2, b.currentPos[2]],
        };

        return updatedCrew;
      }
    }
  }

  // 2. Random Thought Bubble: pick one random crew without active bubble
  const availableCrew = updatedCrew.filter((c) => !c.activeChatBubble);
  if (availableCrew.length > 0 && Math.random() < 0.25) {
    const luckyCrew = availableCrew[Math.floor(Math.random() * availableCrew.length)];
    const thoughtText = RANDOM_THOUGHT_BUBBLES[Math.floor(Math.random() * RANDOM_THOUGHT_BUBBLES.length)];

    luckyCrew.activeChatBubble = {
      id: `thought_${currentTime}_${luckyCrew.id}`,
      speakerId: luckyCrew.id,
      speakerName: luckyCrew.name,
      text: thoughtText,
      type: thoughtText.startsWith('💤') ? 'thought' : 'thought',
      createdAt: currentTime,
      durationMs: 4500,
      worldPos: [luckyCrew.currentPos[0], luckyCrew.currentPos[1] + 2.2, luckyCrew.currentPos[2]],
    };
  }

  return updatedCrew;
}
