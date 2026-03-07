# Avatar UI 预览组件

/**
 * OpenClaw Avatar UI 预览组件
 * 
 * React 组件用于头像预览和切换
 */

import React, { useState, useEffect, useCallback } from 'react';
import { axios } from 'axios';
import { toast } from 'react-hot-toast';

import { 
  AvatarType, 
  AvatarEntity, 
  AvatarPreview 
} from '../types/avatar';

// ========================================
// 图片显示组件
// ========================================

interface ImageAvatarProps {
  avatar: AvatarPreview;
  size?: number;
}

const ImageAvatar: React.FC<ImageAvatarProps> = ({ avatar, size = 48 }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <img
      src={avatar.previewData}
      alt={avatar.metadata.name}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        objectFit: 'cover',
        backgroundColor: '#f0f0f0',
      }}
      loading="lazy"
      onError={() => {
        setError(true);
        setIsLoading(false);
        toast.error('Failed to load image avatar');
      }}
    />
  );
};

// ========================================
// Emoji 显示组件
// ========================================

interface EmojiAvatarProps {
  avatar: AvatarPreview;
  size?: number;
}

const EmojiAvatar: React.FC<EmojiAvatarProps> = ({ avatar, size = 48 }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: '#e0e0e0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.7,
        border: '2px solid #ccc',
      }}
    >
      {avatar.previewData}
    </div>
  );
};

// ========================================
// SVG 图标显示组件
// ========================================

interface IconAvatarProps {
  avatar: AvatarPreview;
  size?: number;
}

const IconAvatar: React.FC<IconAvatarProps> = ({ avatar, size = 48 }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: '#e0e0e0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      dangerouslySetInnerHTML={{
        __html: `<svg viewBox="0 0 24 24" width="80%" height="80%">${avatar.previewData}</svg>`,
      }}
    />
  );
};

// ========================================
// 头像预览主组件
// ========================================

interface AvatarPreviewProps {
  avatarId: string;
  onAvatarSelect?: (avatarId: string) => void;
  showSelector?: boolean;
}

const AvatarPreview: React.FC<AvatarPreviewProps> = ({
  avatarId,
  onAvatarSelect,
  showSelector = true,
}) => {
  const [avatar, setAvatar] = useState<AvatarPreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAvatar = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get<AvatarPreview>(`/api/avatars/${avatarId}/preview`);
      setAvatar(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load avatar preview');
      toast.error('Failed to load avatar');
    } finally {
      setIsLoading(false);
    }
  }, [avatarId]);

  useEffect(() => {
    fetchAvatar();
  }, [fetchAvatar]);

  const renderAvatarContent = () => {
    if (isLoading) {
      return (
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: '#f0f0f0',
            animation: 'pulse 1s infinite',
          }}
        />
      );
    }

    if (error || !avatar) {
      return (
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: '#ffe0e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ff0000',
          }}
        >
          ?
        </div>
      );
    }

    switch (avatar.type) {
      case AvatarType.IMAGE:
        return <ImageAvatar avatar={avatar} />;
      case AvatarType.EMOJI:
        return <EmojiAvatar avatar={avatar} />;
      case AvatarType.ICON:
        return <IconAvatar avatar={avatar} />;
      default:
        return (
          <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#ccc' }}>
            ?
          </div>
        );
    }
  };

  return (
    <div className="avatar-preview">
      <div
        className="avatar-container"
        onClick={() => {
          if (showSelector && onAvatarSelect) {
            onAvatarSelect(avatarId);
          }
        }}
        style={{
          cursor: showSelector ? 'pointer' : 'default',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => {
          if (showSelector) {
            e.currentTarget.style.transform = 'scale(1.1)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {renderAvatarContent()}
      </div>
      
      {showSelector && onAvatarSelect && (
        <div className="avatar-info">
          <h4>{avatar?.metadata.name || 'Unknown Avatar'}</h4>
          {avatar?.metadata.description && (
            <p className="avatar-description">{avatar.metadata.description}</p>
          )}
          {avatar?.metadata.tags && avatar.metadata.tags.length > 0 && (
            <div className="avatar-tags">
              {avatar.metadata.tags.map((tag, index) => (
                <span key={index} className="avatar-tag">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ========================================
// 头像选择器组件
// ========================================

interface AvatarSelectorProps {
  agentId: string;
  userId: string;
  onSelect: (avatarId: string) => void;
  currentAvatarId?: string;
}

const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  agentId,
  userId,
  onSelect,
  currentAvatarId,
}) => {
  const [avatars, setAvatars] = useState<AvatarPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAvatars = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get<{
          items: AvatarPreview[];
        }>(`/api/avatars?agentId=${agentId}&userId=${userId}`);
        setAvatars(response.data.items);
      } catch (err) {
        toast.error('Failed to load avatars');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvatars();
  }, [agentId, userId]);

  if (isLoading) {
    return (
      <div className="avatar-selector-loading">
        <p>Loading avatars...</p>
      </div>
    );
  }

  return (
    <div className="avatar-selector">
      <h3>Select Avatar</h3>
      <div className="avatar-grid">
        {avatars.map((avatar) => (
          <div
            key={avatar.id}
            className={`avatar-item ${currentAvatarId === avatar.id ? 'active' : ''}`}
            onClick={() => onSelect(avatar.id)}
          >
            <AvatarPreview avatarId={avatar.id} showSelector={false} />
            <p>{avatar.metadata.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ========================================
// 头像管理组件
// ========================================

interface AvatarManagerProps {
  agentId: string;
  userId: string;
}

const AvatarManager: React.FC<AvatarManagerProps> = ({ agentId, userId }) => {
  const [currentAvatarId, setCurrentAvatarId] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    const fetchCurrentAvatar = async () => {
      try {
        const response = await axios.get<AvatarEntity>(
          `/api/users/${userId}/agents/${agentId}/current-avatar`
        );
        setCurrentAvatarId(response.data?.id || null);
      } catch (err) {
        // 使用默认头像
        setCurrentAvatarId('default');
      }
    };

    fetchCurrentAvatar();
  }, [agentId, userId]);

  const handleAvatarSelect = useCallback(async (avatarId: string) => {
    try {
      await axios.post('/api/avatars/switch', {
        userId,
        agentId,
        newAvatarId: avatarId,
      });
      
      setCurrentAvatarId(avatarId);
      setShowSelector(false);
      toast.success('Avatar switched successfully');
    } catch (err) {
      toast.error('Failed to switch avatar');
    }
  }, [agentId, userId]);

  return (
    <div className="avatar-manager">
      <div className="current-avatar">
        <h3>Current Avatar</h3>
        <div className="avatar-display">
          <AvatarPreview
            avatarId={currentAvatarId || ''}
            showSelector={true}
            onAvatarSelect={handleAvatarSelect}
          />
        </div>
      </div>

      {showSelector && (
        <div className="avatar-selector-panel">
          <AvatarSelector
            agentId={agentId}
            userId={userId}
            onSelect={handleAvatarSelect}
            currentAvatarId={currentAvatarId}
          />
          <button 
            onClick={() => setShowSelector(false)}
            className="close-button"
          >
            Close
          </button>
        </div>
      )}

      <button
        onClick={() => setShowSelector(!showSelector)}
        className="toggle-selector-button"
      >
        {showSelector ? 'Close Selector' : 'Select New Avatar'}
      </button>
    </div>
  );
};

export {
  AvatarPreview,
  AvatarSelector,
  AvatarManager,
  ImageAvatar,
  EmojiAvatar,
  IconAvatar,
};
