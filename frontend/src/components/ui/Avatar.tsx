import React, { useState } from 'react';
import { getInitials, cn } from '../../utils';
import './Avatar.css';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  src?: string;
  name?: string;
  alt?: string;
  size?: AvatarSize;
  status?: 'online' | 'offline' | 'busy' | 'away';
  className?: string;
  id?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = 'User',
  alt,
  size = 'md',
  status,
  className,
  id,
}) => {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name);

  return (
    <div
      id={id}
      className={cn('pcc-avatar', `pcc-avatar--${size}`, className)}
      title={name}
      aria-label={alt || name}
    >
      {src && !imgError ? (
        <img
          src={src}
          alt={alt || name}
          className="pcc-avatar__image"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="pcc-avatar__initials">{initials}</span>
      )}

      {status && (
        <span
          className={cn('pcc-avatar__status', `pcc-avatar__status--${status}`)}
        />
      )}
    </div>
  );
};
