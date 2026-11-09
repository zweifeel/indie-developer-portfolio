import React from 'react';
import { ProjectRoomConfig, AgentCrewMember } from '../../types/virtualOffice';
import { PixelIsometricCanvas } from './PixelIsometricCanvas';

export interface IsometricRoomCanvasProps {
  room: ProjectRoomConfig;
  reducedMotion?: boolean;
  staticFallback?: boolean;
  onSelectAgent?: (agent: AgentCrewMember) => void;
  selectedAgentId?: string | null;
  className?: string;
  isCloseUp?: boolean;
  onSelectRoom?: () => void;
}

export const IsometricRoomCanvas: React.FC<IsometricRoomCanvasProps> = (props) => {
  return <PixelIsometricCanvas {...props} />;
};
