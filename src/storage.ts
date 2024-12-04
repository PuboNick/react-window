import { WebStorage } from 'pubo-web';

export const storage = new WebStorage({ type: 'localStorage', key: 'panel-layout' });

if (!storage.state) {
  storage.state = {};
}
