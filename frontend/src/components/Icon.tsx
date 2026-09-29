import React from 'react';
import { View, Platform, Text } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

export type IconName =
  | 'home'
  | 'notes'
  | 'reports'
  | 'profile'
  | 'settings'
  | 'bell'
  | 'plus'
  | 'search'
  | 'calendar'
  | 'clock'
  | 'trash'
  | 'edit'
  | 'check'
  | 'close'
  | 'map-pin'
  | 'mic'
  | 'paperclip'
  | 'play'
  | 'pause'
  | 'refresh'
  | 'repeat'
  | 'graduation-cap'
  | 'palette'
  | 'alert'
  | 'chevron-left'
  | 'chevron-right'
  | 'sparkles'
  | 'file-text'
  | 'wifi-off'
  | 'cloud-sync'
  | 'calendar-check'
  | 'layers';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: any;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 20,
  color = '#94A3B8',
  style,
}) => {
  switch (name) {
    case 'home':
      return <Feather name="home" size={size} color={color} style={style} />;
    case 'notes':
      return <Feather name="file-text" size={size} color={color} style={style} />;
    case 'reports':
      return <Feather name="bar-chart-2" size={size} color={color} style={style} />;
    case 'profile':
      return <Feather name="user" size={size} color={color} style={style} />;
    case 'settings':
      return <Feather name="settings" size={size} color={color} style={style} />;
    case 'bell':
      return <Feather name="bell" size={size} color={color} style={style} />;
    case 'plus':
      return <Feather name="plus" size={size} color={color} style={style} />;
    case 'search':
      return <Feather name="search" size={size} color={color} style={style} />;
    case 'calendar':
      return <Feather name="calendar" size={size} color={color} style={style} />;
    case 'clock':
      return <Feather name="clock" size={size} color={color} style={style} />;
    case 'trash':
      return <Feather name="trash-2" size={size} color={color} style={style} />;
    case 'edit':
      return <Feather name="edit-2" size={size} color={color} style={style} />;
    case 'check':
      return <Feather name="check" size={size} color={color} style={style} />;
    case 'close':
      return <Feather name="x" size={size} color={color} style={style} />;
    case 'map-pin':
      return <Feather name="map-pin" size={size} color={color} style={style} />;
    case 'mic':
      return <Feather name="mic" size={size} color={color} style={style} />;
    case 'paperclip':
      return <Feather name="paperclip" size={size} color={color} style={style} />;
    case 'play':
      return <Feather name="play" size={size} color={color} style={style} />;
    case 'pause':
      return <Feather name="pause" size={size} color={color} style={style} />;
    case 'refresh':
      return <Feather name="refresh-cw" size={size} color={color} style={style} />;
    case 'repeat':
      return <Feather name="repeat" size={size} color={color} style={style} />;
    case 'file-text':
      return <Feather name="file-text" size={size} color={color} style={style} />;
    case 'calendar-check':
      return <MaterialCommunityIcons name="calendar-check-outline" size={size} color={color} style={style} />;
    case 'layers':
      return <Feather name="layers" size={size} color={color} style={style} />;
    case 'wifi-off':
      return <Feather name="wifi-off" size={size} color={color} style={style} />;
    case 'cloud-sync':
      return <MaterialCommunityIcons name="cloud-sync-outline" size={size} color={color} style={style} />;
    case 'graduation-cap':
      return <MaterialCommunityIcons name="school-outline" size={size} color={color} style={style} />;
    case 'palette':
      return <MaterialCommunityIcons name="palette-outline" size={size} color={color} style={style} />;
    case 'alert':
      return <Feather name="alert-triangle" size={size} color={color} style={style} />;
    case 'chevron-left':
      return <Feather name="chevron-left" size={size} color={color} style={style} />;
    case 'chevron-right':
      return <Feather name="chevron-right" size={size} color={color} style={style} />;
    case 'sparkles':
      return <MaterialCommunityIcons name="sparkles" size={size} color={color} style={style} />;
    default:
      return <Feather name="circle" size={size} color={color} style={style} />;
  }
};
