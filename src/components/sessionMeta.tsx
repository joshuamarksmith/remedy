import type { SessionType } from '../types';

export const SESSION_TYPE_LABEL: Record<SessionType, string> = {
  skill: 'Skill',
  strength: 'Strength',
  conditioning: 'Conditioning',
  complex: 'Complex',
  test: 'Test',
  recovery: 'Recovery',
};

export const SESSION_TYPE_TONE: Record<SessionType, 'default' | 'ember' | 'mint' | 'steel'> = {
  skill: 'steel',
  strength: 'ember',
  conditioning: 'ember',
  complex: 'steel',
  test: 'mint',
  recovery: 'default',
};
