// AI-One 版本检测器
// 用途：检测 GitHub Release 新版本

export interface ReleaseInfo {
  version: string;
  url: string;
  notes: string;
  sha256?: string;
}

export class VersionDetector {
  private pollInterval: number = 300000; // 5 分钟
  private currentVersion: string;
  private repo: string;
  
  constructor(currentVersion: string, repo: string = 'WangYan-Good/ai-one') {
    this.currentVersion = currentVersion;
    this.repo = repo;
  }
  
  /**
   * 检查新版本
   */
  async check(): Promise<ReleaseInfo | null> {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${this.repo}/releases/latest`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'AI-One-VersionDetector'
          }
        }
      );
      
      if (!response.ok) {
        console.warn(`GitHub API 返回 ${response.status}`);
        return null;
      }
      
      const release = await response.json();
      const latestVersion = release.tag_name || release.name;
      
      if (this.compare(latestVersion, this.currentVersion) > 0) {
        console.log(`发现新版本：${latestVersion}`);
        return {
          version: latestVersion,
          url: release.assets?.[0]?.browser_download_url || release.html_url,
          notes: release.body || '',
          sha256: release.assets?.[0]?.sha256
        };
      }
      
      return null;
    } catch (error) {
      console.error('版本检测失败:', error);
      return null;
    }
  }
  
  /**
   * 版本比较
   * @returns 1 (v1 > v2), 0 (v1 = v2), -1 (v1 < v2)
   */
  compare(v1: string, v2: string): number {
    const parts1 = v1.replace('v', '').split('.').map(Number);
    const parts2 = v2.replace('v', '').split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
      if (parts1[i] > parts2[i]) return 1;
      if (parts1[i] < parts2[i]) return -1;
    }
    return 0;
  }
  
  /**
   * 启动轮询
   */
  startPolling(callback: (release: ReleaseInfo) => void) {
    setInterval(async () => {
      const release = await this.check();
      if (release) {
        callback(release);
      }
    }, this.pollInterval);
  }
}
