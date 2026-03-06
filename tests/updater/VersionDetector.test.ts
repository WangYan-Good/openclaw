import { VersionDetector } from '../../src/updater/VersionDetector';

describe('VersionDetector', () => {
  let detector: VersionDetector;
  
  beforeEach(() => {
    detector = new VersionDetector('1.0.0');
  });
  
  describe('compare', () => {
    it('should detect newer version', () => {
      expect(detector.compare('1.0.1', '1.0.0')).toBe(1);
      expect(detector.compare('1.1.0', '1.0.0')).toBe(1);
      expect(detector.compare('2.0.0', '1.0.0')).toBe(1);
    });
    
    it('should detect same version', () => {
      expect(detector.compare('1.0.0', '1.0.0')).toBe(0);
      expect(detector.compare('v1.0.0', '1.0.0')).toBe(0);
    });
    
    it('should detect older version', () => {
      expect(detector.compare('0.9.9', '1.0.0')).toBe(-1);
      expect(detector.compare('1.0.0', '1.0.1')).toBe(-1);
    });
  });
  
  describe('check', () => {
    it('should return null when no newer version', async () => {
      // Mock current version is latest
      detector = new VersionDetector('99.99.99');
      const release = await detector.check();
      expect(release).toBeNull();
    });
  });
});
