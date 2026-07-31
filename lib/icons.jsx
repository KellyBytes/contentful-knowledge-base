import { createElement } from 'react';
import {
  Braces,
  FileCode2,
  Component,
  Layers,
  Palette,
  Server,
  Database,
  Globe,
} from 'lucide-react';

const iconMap = {
  braces: Braces,
  'file-code-2': FileCode2,
  component: Component,
  layers: Layers,
  palette: Palette,
  server: Server,
  database: Database,
  globe: Globe,
};

const CategoryIcon = ({ name, className }) =>
  createElement(iconMap[name] ?? Globe, {
    className,
    'aria-hidden': true,
  });

export default CategoryIcon;
