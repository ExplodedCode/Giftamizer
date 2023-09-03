import * as React from 'react';
import moment from 'moment';

import { Grid, LinearProgress, Paper, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { LineChart, Line, XAxis, YAxis, Label, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';

import { UserCreatedAtChartData, useGetUserCreatedAtData } from '../../lib/useSupabase';
import Title from '../../components/Title';

// @ts-ignore
const CustomTooltip = ({ active, payload, label }) => {
	if (active && payload && payload.length) {
		return (
			<Paper sx={{ padding: 1 }} elevation={3}>
				<Typography>{`${label}: ${payload[0].value}`} Users</Typography>
			</Paper>
		);
	}

	return null;
};

export default function SignupsChart() {
	const theme = useTheme();

	const [timeRange, setTimeRange] = React.useState('1y');

	const { data: users, isLoading } = useGetUserCreatedAtData();

	const filterByTimeRange = (data: UserCreatedAtChartData[] | undefined) => {
		if (!data) return [];

		switch (timeRange) {
			case '1m':
				return data.filter((u) => moment(u.prettyTime).unix() >= moment().subtract(1, 'month').unix());
			case '6m':
				return data.filter((u) => moment(u.prettyTime).unix() >= moment().subtract(6, 'months').unix());
			case '1y':
				return data.filter((u) => moment(u.prettyTime).unix() >= moment().subtract(1, 'year').unix());
			default:
				return data;
		}
	};

	return (
		<>
			<Grid container>
				<Grid item xs>
					<Title>Signups</Title>
				</Grid>
				<Grid item>
					<ToggleButtonGroup color='primary' size='small' exclusive value={timeRange} onChange={(e, v) => setTimeRange(v)}>
						<ToggleButton value='1m'>1M</ToggleButton>
						<ToggleButton value='6m'>6M</ToggleButton>
						<ToggleButton value='1y'>1Y</ToggleButton>
						<ToggleButton value='all'>MAX</ToggleButton>
					</ToggleButtonGroup>
				</Grid>
			</Grid>

			{isLoading ? (
				<LinearProgress />
			) : (
				<>
					<ResponsiveContainer>
						<LineChart
							data={filterByTimeRange(users)}
							margin={{
								top: 16,
								right: 16,
								bottom: 0,
								left: 24,
							}}
						>
							<XAxis dataKey='prettyTime' stroke={theme.palette.text.secondary} style={theme.typography.body2} />
							<YAxis
								stroke={theme.palette.text.secondary}
								style={theme.typography.body2}
								domain={[
									filterByTimeRange(users)[0].Users! - (filterByTimeRange(users)[0].Users! > 0 ? 1 : 0),
									filterByTimeRange(users)[filterByTimeRange(users).length - 1].Users! + 1,
								]}
							>
								<Label
									angle={270}
									position='left'
									style={{
										textAnchor: 'middle',
										fill: theme.palette.text.primary,
										...theme.typography.body1,
									}}
								>
									User Count
								</Label>
							</YAxis>
							<Line isAnimationActive type='basis' dataKey='Users' stroke={theme.palette.primary.main} dot={false} activeDot={{ r: 8 }} />
							{/* @ts-ignore */}
							<Tooltip content={<CustomTooltip />} />

							{users
								?.filter((u) => u.prettyTime.startsWith('01/01') && u.prettyTime > '01/01/2017')
								.map((u) => (
									<ReferenceLine key={u.prettyTime} x={u.prettyTime} stroke='green' strokeDasharray='1 8' />
								))}
						</LineChart>
					</ResponsiveContainer>
				</>
			)}
		</>
	);
}
