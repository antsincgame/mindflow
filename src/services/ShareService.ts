import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EncryptedStorage from 'react-native-encrypted-storage';
import Share from 'react-native-share';
import { HeatmapDataPoint, ChartDataPoint, StatsPeriod } from '../models/Statistics';
import { Session } from '../models/Session';
import { StorageService } from './StorageService';

const SHARE_LINKS_KEY = 'mindflow_share_links';
const SHARE_DATA_PREFIX = 'mindflow_share_data_';
const BASE_URL = 'https://mindflow.app/shared';

export interface ShareableData {
  heatmapData: HeatmapDataPoint[];
  stressChartData: ChartDataPoint[];
  sleepChartData: ChartDataPoint[];
  sessionCountChartData: ChartDataPoint[];
  totalSessions: number;
  averageStressReduction: number;
  currentStreak: number;
  periodLabel: string;
}

export interface ShareLink {
  id: string;
  token: string;
  label: string;
  recipientDescription: string;
  createdAt: string;
  expiresAt: string | null;
  isActive: boolean;
  accessCount: number;
  lastAccessedAt: string | null;
  permissions: SharePermissions;
}

export interface SharePermissions {
  showHeatmap: boolean;
  showStressChart: boolean;
  showSleepChart: boolean;
  showSessionCount: boolean;
  showStreak: boolean;
}

export interface SharePreview {
  shareableData: ShareableData;
  permissions: SharePermissions;
  generatedAt: string;
}

export interface CreateShareLinkOptions {
  recipientDescription: string;
  label?: string;
  expiresInDays?: number | null;
  permissions?: Partial<SharePermissions>;
  period?: StatsPeriod;
}

const DEFAULT_PERMISSIONS: SharePermissions = {
  showHeatmap: true,
  showStressChart: true,
  showSleepChart: true,
  showSessionCount: true,
  showStreak: true,
};

class ShareServiceClass {
  private cachedLinks: ShareLink[] | null = null;

  async createShareLink(options: CreateShareLinkOptions): Promise<ShareLink> {
    const {
      recipientDescription,
      label,
      expiresInDays = 30,
      permissions = {},
      period = 'month',
    } = options;

    const id = uuidv4();
    const token = this.generateToken();

    const mergedPermissions: SharePermissions = {
      ...DEFAULT_PERMISSIONS,
      ...permissions,
    };

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const shareLink: ShareLink = {
      id,
      token,
      label: label || `Ссылка для ${recipientDescription}`,
      recipientDescription,
      createdAt: new Date().toISOString(),
      expiresAt,
      isActive: true,
      accessCount: 0,
      lastAccessedAt: null,
      permissions: mergedPermissions,
    };

    const shareableData = await this.gatherShareableData(period);
    await this.saveShareData(token, shareableData, mergedPermissions);

    const links = await this.getActiveLinks();
    links.push(shareLink);
    await this.saveLinks(links);

    return shareLink;
  }

  async getShareUrl(link: ShareLink): Promise<string> {
    return `${BASE_URL}/${link.token}`;
  }

  async shareLink(link: ShareLink): Promise<void> {
    const url = await this.getShareUrl(link);

    try {
      await Share.open({
        title: 'Мой прогресс в MindFlow',
        message: `Посмотри мой прогресс в медитации и управлении стрессом: ${url}`,
        url,
        subject: 'Прогресс MindFlow',
      });

      await this.incrementAccessCount(link.id);
    } catch (error: any) {
      if (error?.message !== 'User did not share') {
        throw error;
      }
    }
  }

  async getActiveLinks(): Promise<ShareLink[]> {
    if (this.cachedLinks) {
      return this.cachedLinks;
    }

    try {
      const stored = await AsyncStorage.getItem(SHARE_LINKS_KEY);
      const links: ShareLink[] = stored ? JSON.parse(stored) : [];
      this.cachedLinks = links;
      return links;
    } catch (error) {
      console.error('Error loading share links:', error);
      return [];
    }
  }

  async getActiveLinkCount(): Promise<number> {
    const links = await this.getActiveLinks();
    return links.filter((l) => l.isActive && !this.isExpired(l)).length;
  }

  async getLinkById(id: string): Promise<ShareLink | null> {
    const links = await this.getActiveLinks();
    return links.find((l) => l.id === id) || null;
  }

  async getLinkByToken(token: string): Promise<ShareLink | null> {
    const links = await this.getActiveLinks();
    return links.find((l) => l.token === token) || null;
  }

  async revokeLink(id: string): Promise<void> {
    const links = await this.getActiveLinks();
    const linkIndex = links.findIndex((l) => l.id === id);

    if (linkIndex === -1) {
      throw new Error('Share link not found');
    }

    const link = links[linkIndex];
    links[linkIndex] = { ...link, isActive: false };

    await this.saveLinks(links);
    await this.removeShareData(link.token);
  }

  async revokeAllLinks(): Promise<void> {
    const links = await this.getActiveLinks();

    for (const link of links) {
      await this.removeShareData(link.token);
    }

    const deactivatedLinks = links.map((l) => ({ ...l, isActive: false }));
    await this.saveLinks(deactivatedLinks);
  }

  async deleteLink(id: string): Promise<void> {
    const links = await this.getActiveLinks();
    const link = links.find((l) => l.id === id);

    if (link) {
      await this.removeShareData(link.token);
    }

    const filteredLinks = links.filter((l) => l.id !== id);
    await this.saveLinks(filteredLinks);
  }

  async deleteAllInactiveLinks(): Promise<void> {
    const links = await this.getActiveLinks();
    const inactiveLinks = links.filter((l) => !l.isActive || this.isExpired(l));

    for (const link of inactiveLinks) {
      await this.removeShareData(link.token);
    }

    const activeLinks = links.filter((l) => l.isActive && !this.isExpired(l));
    await this.saveLinks(activeLinks);
  }

  async updateLinkPermissions(
    id: string,
    permissions: Partial<SharePermissions>
  ): Promise<ShareLink> {
    const links = await this.getActiveLinks();
    const linkIndex = links.findIndex((l) => l.id === id);

    if (linkIndex === -1) {
      throw new Error('Share link not found');
    }

    const link = links[linkIndex];
    const updatedPermissions: SharePermissions = {
      ...link.permissions,
      ...permissions,
    };

    links[linkIndex] = { ...link, permissions: updatedPermissions };
    await this.saveLinks(links);

    const shareData = await this.getShareData(link.token);
    if (shareData) {
      await this.saveShareData(link.token, shareData.shareableData, updatedPermissions);
    }

    return links[linkIndex];
  }

  async extendLinkExpiration(id: string, additionalDays: number): Promise<ShareLink> {
    const links = await this.getActiveLinks();
    const linkIndex = links.findIndex((l) => l.id === id);

    if (linkIndex === -1) {
      throw new Error('Share link not found');
    }

    const link = links[linkIndex];
    const baseDate = link.expiresAt ? new Date(link.expiresAt) : new Date();
    const newExpiry = new Date(baseDate.getTime() + additionalDays * 24 * 60 * 60 * 1000);

    links[linkIndex] = { ...link, expiresAt: newExpiry.toISOString() };
    await this.saveLinks(links);

    return links[linkIndex];
  }

  async refreshShareData(id: string, period: StatsPeriod = 'month'): Promise<void> {
    const link = await this.getLinkById(id);
    if (!link || !link.isActive) {
      throw new Error('Share link not found or inactive');
    }

    const shareableData = await this.gatherShareableData(period);
    await this.saveShareData(link.token, shareableData, link.permissions);
  }

  async generatePreview(
    permissions: SharePermissions = DEFAULT_PERMISSIONS,
    period: StatsPeriod = 'month'
  ): Promise<SharePreview> {
    const shareableData = await this.gatherShareableData(period);

    return {
      shareableData: this.filterDataByPermissions(shareableData, permissions),
      permissions,
      generatedAt: new Date().toISOString(),
    };
  }

  isExpired(link: ShareLink): boolean {
    if (!link.expiresAt) {
      return false;
    }
    return new Date(link.expiresAt).getTime() < Date.now();
  }

  isLinkValid(link: ShareLink): boolean {
    return link.isActive && !this.isExpired(link);
  }

  private async gatherShareableData(period: StatsPeriod): Promise<ShareableData> {
    try {
      const sessions = await this.loadSessions();
      const now = new Date();
      const filteredSessions = this.filterSessionsByPeriod(sessions, period, now);

      const heatmapData = this.buildHeatmapData(filteredSessions);
      const stressChartData = this.buildStressChartData(filteredSessions);
      const sleepChartData = this.buildSleepChartData(filteredSessions);
      const sessionCountChartData = this.buildSessionCountChartData(filteredSessions);

      const totalSessions = filteredSessions.length;
      const averageStressReduction = this.calculateAverageStressReduction(filteredSessions);
      const currentStreak = this.calculateCurrentStreak(sessions);

      const periodLabels: Record<StatsPeriod, string> = {
        week: 'Неделя',
        month: 'Месяц',
        all: 'Всё время',
      };

      return {
        heatmapData,
        stressChartData,
        sleepChartData,
        sessionCountChartData,
        totalSessions,
        averageStressReduction,
        currentStreak,
        periodLabel: periodLabels[period],
      };
    } catch (error) {
      console.error('Error gathering shareable data:', error);
      return {
        heatmapData: [],
        stressChartData: [],
        sleepChartData: [],
        sessionCountChartData: [],
        totalSessions: 0,
        averageStressReduction: 0,
        currentStreak: 0,
        periodLabel: 'Месяц',
      };
    }
  }

  private filterDataByPermissions(
    data: ShareableData,
    permissions: SharePermissions
  ): ShareableData {
    return {
      ...data,
      heatmapData: permissions.showHeatmap ? data.heatmapData : [],
      stressChartData: permissions.showStressChart ? data.stressChartData : [],
      sleepChartData: permissions.showSleepChart ? data.sleepChartData : [],
      sessionCountChartData: permissions.showSessionCount ? data.sessionCountChartData : [],
      currentStreak: permissions.showStreak ? data.currentStreak : 0,
    };
  }

  private async loadSessions(): Promise<Session[]> {
    try {
      const stored = await AsyncStorage.getItem('mindflow_sessions');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading sessions:', error);
      return [];
    }
  }

  private filterSessionsByPeriod(
    sessions: Session[],
    period: StatsPeriod,
    now: Date
  ): Session[] {
    if (period === 'all') {
      return sessions;
    }

    const daysBack = period === 'week' ? 7 : 30;
    const cutoff = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    return sessions.filter((s) => new Date(s.startedAt) >= cutoff);
  }

  private buildHeatmapData(sessions: Session[]): HeatmapDataPoint[] {
    const dateCountMap: Record<string, number> = {};

    for (const session of sessions) {
      const dateKey = new Date(session.startedAt).toISOString().split('T')[0];
      dateCountMap[dateKey] = (dateCountMap[dateKey] || 0) + 1;
    }

    return Object.entries(dateCountMap).map(([date, count]) => ({
      date,
      value: count,
    }));
  }

  private buildStressChartData(sessions: Session[]): ChartDataPoint[] {
    const dateStressMap: Record<string, { total: number; count: number }> = {};

    for (const session of sessions) {
      if (session.stressLevelAfter !== undefined && session.stressLevelAfter !== null) {
        const dateKey = new Date(session.startedAt).toISOString().split('T')[0];
        if (!dateStressMap[dateKey]) {
          dateStressMap[dateKey] = { total: 0, count: 0 };
        }
        dateStressMap[dateKey].total += session.stressLevelAfter;
        dateStressMap[dateKey].count += 1;
      }
    }

    return Object.entries(dateStressMap)
      .map(([date, { total, count }]) => ({
        date,
        value: Math.round(total / count),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private buildSleepChartData(_sessions: Session[]): ChartDataPoint[] {
    // Sleep data comes from HealthKit, not sessions directly.
    // Return empty array; in production, this would query HealthKit aggregates.
    return [];
  }

  private buildSessionCountChartData(sessions: Session[]): ChartDataPoint[] {
    const dateCountMap: Record<string, number> = {};

    for (const session of sessions) {
      const dateKey = new Date(session.startedAt).toISOString().split('T')[0];
      dateCountMap[dateKey] = (dateCountMap[dateKey] || 0) + 1;
    }

    return Object.entries(dateCountMap)
      .map(([date, count]) => ({
        date,
        value: count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private calculateAverageStressReduction(sessions: