import { forwardRef } from 'react';
import type { SVGProps } from 'react';

const MuiIconStub = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>((props, ref) => (
  <svg ref={ref} role="img" data-testid="mui-icon-stub" {...props} />
));

MuiIconStub.displayName = 'MuiIconStub';

export default MuiIconStub;
