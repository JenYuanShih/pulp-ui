import * as React from 'react';
import { Route, RouteComponentProps, Switch } from 'react-router-dom';
import { Alert, PageSection } from '@patternfly/react-core';
import { DynamicImport } from '@app/DynamicImport';
import { accessibleRouteChangeHandler } from '@app/utils/utils';
import { Dashboard } from '@app/Dashboard/Dashboard';
import { ViewRepo } from '@app/ViewRepo/ViewRepo';
import { MonitorTasks } from '@app/MonitorTasks/MonitorTasks';
import { GeneralSettings } from '@app/Settings/General/GeneralSettings';
import { ProfileSettings } from '@app/Settings/Profile/ProfileSettings';
import { NotFound } from '@app/NotFound/NotFound';
import { useDocumentTitle } from '@app/utils/useDocumentTitle';
import { LastLocationProvider, useLastLocation } from 'react-router-last-location';
import { TasksIconConfig } from '@patternfly/react-icons';
import { Contacts } from './Contacts/Contacts';
import { RepoList } from './RepoList/RepoList';
import { Status } from './Status/Status';

let routeFocusTimer: number;

const getSupportModuleAsync = () => () => import(/* webpackChunkName: 'support' */ '@app/Support/Support');

const Support = (routeProps: RouteComponentProps): React.ReactElement => {
  const lastNavigation = useLastLocation();
  return (
    /* eslint-disable @typescript-eslint/no-explicit-any */
    <DynamicImport load={getSupportModuleAsync()} focusContentAfterMount={lastNavigation !== null}>
      {(Component: any) => {
        let loadedComponent: any;
        /* eslint-enable @typescript-eslint/no-explicit-any */
        if (Component === null) {
          loadedComponent = (
            <PageSection aria-label="Loading Content Container">
              <div className="pf-l-bullseye">
                <Alert title="Loading" className="pf-l-bullseye__item" />
              </div>
            </PageSection>
          );
        } else {
          loadedComponent = <Component.Support {...routeProps} />;
        }
        return loadedComponent;
      }}
    </DynamicImport>
  );
};

export interface IAppRoute {
  label?: string; // Excluding the label will exclude the route from the nav sidebar in AppLayout
  /* eslint-disable @typescript-eslint/no-explicit-any */
  component: React.ComponentType<RouteComponentProps<any>> | React.ComponentType<any>;
  /* eslint-enable @typescript-eslint/no-explicit-any */
  exact?: boolean;
  path: string;
  title: string;
  isAsync?: boolean;
  routes?: undefined;
}

export interface IAppRouteGroup {
  label: string;
  routes: IAppRoute[];
}

export type AppRouteConfig = IAppRoute | IAppRouteGroup;

const routes: AppRouteConfig[] = [
  {
    component: Dashboard,
    exact: true,
    label: 'Dashboard',
    path: '/',
    title: 'Pulp 3 | Main Dashboard',
  },
  {
    component: ViewRepo,
    exact: true,
    path: '/ViewRepo',
    title: 'Pulp 3 | Content Page'
  },
  {
    component: RepoList,
    exact: true,
    label: 'Repository List',
    path: '/RepoList',
    title: 'Pulp 3 | Repository List'
  },
  {
    component: MonitorTasks,
    exact: true,
    label: 'Monitor Tasks',
    path: '/monitor',
    title: "Pulp 3 | Monitor Tasks"
  },
  {
    component: Support,
    exact: true,
    isAsync: true,
    label: 'Support',
    path: '/support',
    title: 'Pulp 3 | Support Page',
  },
  {
    label: 'Settings',
    routes: [
      {
        component: GeneralSettings,
        exact: true,
        label: 'General',
        path: '/settings/general',
        title: 'Pulp 3 | General Settings',
      },
      {
        component: ProfileSettings,
        exact: true,
        label: 'Profile',
        path: '/settings/profile',
        title: 'Pulp 3 | Profile Settings',
      },
    ],
  },
  {
    component: Contacts,
    exact: true,
    isAsync: true,
    label: 'Contacts',
    path: '/Contacts',
    title: 'Pulp 3 | Contacts Page'
  },
  {
    component: Status,
    exact: true,
    isAsync: true,
    label: 'Status',
    path: '/Status',
    title: 'Pulp 3 | Status Page'
  }
];

// a custom hook for sending focus to the primary content container
// after a view has loaded so that subsequent press of tab key
// sends focus directly to relevant content
const useA11yRouteChange = (isAsync: boolean) => {
  const lastNavigation = useLastLocation();
  React.useEffect(() => {
    if (!isAsync && lastNavigation !== null) {
      routeFocusTimer = accessibleRouteChangeHandler();
    }
    return () => {
      window.clearTimeout(routeFocusTimer);
    };
  }, [isAsync, lastNavigation]);
};

const RouteWithTitleUpdates = ({ component: Component, isAsync = false, title, ...rest }: IAppRoute) => {
  useA11yRouteChange(isAsync);
  useDocumentTitle(title);

  function routeWithTitle(routeProps: RouteComponentProps) {
    return <Component {...rest} {...routeProps} />;
  }

  return <Route render={routeWithTitle} />;
};

const PageNotFound = ({ title }: { title: string }) => {
  useDocumentTitle(title);
  return <Route component={NotFound} />;
};

const flattenedRoutes: IAppRoute[] = routes.reduce(
  (flattened, route) => [...flattened, ...(route.routes ? route.routes : [route])],
  [] as IAppRoute[]
);

const AppRoutes = (): React.ReactElement => (
  <LastLocationProvider>
    <Switch>
      {flattenedRoutes.map(({ path, exact, component, title, isAsync }, idx) => (
        <RouteWithTitleUpdates
          path={path}
          exact={exact}
          component={component}
          key={idx}
          title={title}
          isAsync={isAsync}
        />
      ))}
      <PageNotFound title="404 Page Not Found" />
    </Switch>
  </LastLocationProvider>
);

export { AppRoutes, routes };